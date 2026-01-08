"""
Stress Test Script cho Flow Đăng ký Tín chỉ
Thực hiện các flow theo thứ tự và đo thời gian thực hiện
"""

import requests
import time
import csv
import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import sys
import os

# Import config nếu có
try:
    import config
except ImportError:
    config = None


class StressTestClient:
    """Client để thực hiện stress test các API endpoints"""
    
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.password = password
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.student_id: Optional[int] = None
        
    def login(self) -> bool:
        """Đăng nhập và lấy JWT token"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": self.email, "password": self.password},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            # Xử lý response format (có thể có success wrapper hoặc không)
            if isinstance(data, dict):
                if 'data' in data and isinstance(data['data'], dict):
                    result = data['data']
                else:
                    result = data
                
                self.access_token = result.get('accessToken') or result.get('access_token')
                if not self.access_token:
                    print(f"❌ Không tìm thấy access token trong response: {data}")
                    return False
                    
                # Lấy student ID nếu có
                student = result.get('student')
                if student and isinstance(student, dict):
                    self.student_id = student.get('id') or student.get('studentId')
                    
                # Set header cho các request tiếp theo
                self.session.headers.update({
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json'
                })
                return True
            return False
        except Exception as e:
            print(f"❌ Lỗi đăng nhập: {e}")
            return False
    
    def get_my_schedule(self) -> Optional[Dict]:
        """Bước 1: Lấy lịch học hiện tại"""
        try:
            response = self.session.get(
                f"{self.base_url}/registrations/my-schedule",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data') if isinstance(data, dict) and 'data' in data else data
        except Exception as e:
            print(f"❌ Lỗi lấy lịch học: {e}")
            return None
    
    def get_available_courses(self) -> Optional[List[Dict]]:
        """Bước 2: Lấy danh sách môn học có sẵn"""
        try:
            response = self.session.get(
                f"{self.base_url}/temporaries/available-courses",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            courses = data.get('data') if isinstance(data, dict) and 'data' in data else data
            if isinstance(courses, list):
                return courses
            return []
        except Exception as e:
            print(f"❌ Lỗi lấy danh sách môn học: {e}")
            return None
    
    def get_course_sections(self, course_id: int, page: int = 1, limit: int = 10) -> Optional[Dict]:
        """Bước 3: Lấy danh sách lớp học phần của môn học"""
        try:
            response = self.session.get(
                f"{self.base_url}/course-sections/course/{course_id}",
                params={"page": page, "limit": limit},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data') if isinstance(data, dict) and 'data' in data else data
        except Exception as e:
            print(f"❌ Lỗi lấy lớp học phần: {e}")
            return None
    
    def register_section(self, section_id: int) -> Optional[Dict]:
        """Bước 4: Đăng ký học phần"""
        try:
            response = self.session.post(
                f"{self.base_url}/registrations",
                json={"sectionId": section_id},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get('data') if isinstance(data, dict) and 'data' in data else data
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', error_data.get('error', str(e)))
                except:
                    error_msg = e.response.text or str(e)
            return {"error": error_msg}
    
    def cancel_registration(self, registration_id: Optional[int] = None, section_id: Optional[int] = None) -> bool:
        """Hủy đăng ký bằng registrationId hoặc sectionId"""
        try:
            # Sử dụng registrationId nếu có, nếu không thì dùng 0 và truyền sectionId qua query param
            reg_id = registration_id if registration_id else 0
            url = f"{self.base_url}/registrations/{reg_id}"
            
            if section_id:
                url += f"?sectionId={section_id}"
            
            response = self.session.delete(url, timeout=10)
            response.raise_for_status()
            return True
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get('message', error_data.get('error', str(e)))
                except:
                    error_msg = e.response.text or str(e)
            print(f"❌ Lỗi hủy đăng ký (reg_id={registration_id}, section_id={section_id}): {error_msg}")
            return False
    
    def execute_full_registration_flow(self) -> Tuple[bool, float, Optional[int], Optional[int]]:
        """
        Thực hiện flow đăng ký đầy đủ từ đầu đến cuối
        Returns: (success, duration, registration_id, section_id)
        """
        start_time = time.time()
        registration_id = None
        section_id = None
        
        try:
            # Bước 1: Xem lịch học hiện tại
            schedule = self.get_my_schedule()
            if schedule is None:
                return (False, time.time() - start_time, None, None)
            
            # Lấy danh sách các courseId đã đăng ký từ lịch học
            registered_course_ids = set()
            if schedule and isinstance(schedule, dict):
                schedules = schedule.get('schedules', [])
                if isinstance(schedules, list):
                    for sched in schedules:
                        section = sched.get('section', {})
                        if section and isinstance(section, dict):
                            registered_course_id = section.get('courseId')
                            if registered_course_id:
                                registered_course_ids.add(registered_course_id)
            
            # Bước 2: Xem các môn học có sẵn
            courses = self.get_available_courses()
            if not courses or len(courses) == 0:
                print("⚠️  Không có môn học nào có sẵn")
                return (False, time.time() - start_time, None, None)
            
            # Lọc ra các môn học chưa đăng ký
            unregistered_courses = []
            for course in courses:
                course_id = course.get('courseId') or course.get('course', {}).get('courseId')
                if not course_id:
                    # Thử tìm trong nested structure
                    if 'course' in course and isinstance(course['course'], dict):
                        course_id = course['course'].get('courseId')
                
                if course_id and course_id not in registered_course_ids:
                    unregistered_courses.append(course)
            
            # Nếu không còn môn nào chưa đăng ký, thử chọn từ tất cả các môn
            if not unregistered_courses:
                print("⚠️  Đã đăng ký tất cả các môn học có sẵn, sẽ thử chọn từ tất cả môn")
                unregistered_courses = courses
            
            if not unregistered_courses:
                print("⚠️  Không có môn học nào để đăng ký")
                return (False, time.time() - start_time, None, None)
            
            # Bước 3: Chọn môn học ngẫu nhiên từ danh sách chưa đăng ký
            selected_course = random.choice(unregistered_courses)
            course_id = selected_course.get('courseId') or selected_course.get('course', {}).get('courseId')
            if not course_id:
                # Thử tìm trong nested structure
                if 'course' in selected_course and isinstance(selected_course['course'], dict):
                    course_id = selected_course['course'].get('courseId')
            
            if not course_id:
                print(f"⚠️  Không tìm thấy courseId trong: {selected_course}")
                return (False, time.time() - start_time, None, None)
            
            sections_data = self.get_course_sections(course_id)
            if not sections_data:
                return (False, time.time() - start_time, None, None)
            
            # Lấy danh sách sections
            sections = sections_data.get('data', []) if isinstance(sections_data, dict) else sections_data
            if not isinstance(sections, list) or len(sections) == 0:
                print("⚠️  Không có lớp học phần nào có sẵn")
                return (False, time.time() - start_time, None, None)
            
            # Tìm các section có status 'open' và chưa đầy
            available_sections = []
            for section in sections:
                status = section.get('status', '').lower()
                current = section.get('currentStudents', 0)
                max_students = section.get('maxStudents', 0)
                
                if status == 'open' and current < max_students:
                    available_sections.append(section)
            
            # Chọn ngẫu nhiên một section từ danh sách available, nếu không có thì chọn ngẫu nhiên từ tất cả sections
            if available_sections:
                available_section = random.choice(available_sections)
            else:
                # Nếu không có section open nào, chọn ngẫu nhiên từ tất cả sections
                available_section = random.choice(sections)
            
            section_id = available_section.get('sectionId')
            if not section_id:
                print(f"⚠️  Không tìm thấy sectionId trong: {available_section}")
                return (False, time.time() - start_time, None, None)
            
            # Bước 4: Đăng ký học phần
            registration_result = self.register_section(section_id)
            # Nếu không có error trong result và response không throw exception thì coi như thành công
            # (có thể response thành công nhưng không có data, vẫn là hợp lệ)
            if registration_result is None or 'error' not in registration_result:
                # Lấy registrationId nếu có trong response
                if registration_result and isinstance(registration_result, dict):
                    registration_id = registration_result.get('registrationId') or registration_result.get('id')
                # section_id đã được lưu ở trên, giữ lại để dùng cho hủy đăng ký
                duration = time.time() - start_time
                return (True, duration, registration_id, section_id)
            else:
                error = registration_result.get('error', 'Unknown error') if registration_result else 'No response'
                print(f"⚠️  Đăng ký thất bại: {error}")
                duration = time.time() - start_time
                return (False, duration, None, None)
                
        except Exception as e:
            print(f"❌ Lỗi trong flow đăng ký: {e}")
            return (False, time.time() - start_time, None, None)


def run_stress_test(
    base_url: str,
    email: str,
    password: str,
    num_iterations: int,
    num_threads: int = 1,
    output_file: str = "distribution.csv"
):
    """
    Chạy stress test với số lần lặp và số thread được chỉ định
    
    Args:
        base_url: URL base của backend API
        email: Email để đăng nhập
        password: Password để đăng nhập
        num_iterations: Số lần lặp lại (mỗi lần = 1 flow đăng ký + 1 hủy)
        num_threads: Số thread chạy đồng thời
        output_file: Tên file CSV để lưu kết quả
    """
    print(f"🚀 Bắt đầu stress test...")
    print(f"   - Base URL: {base_url}")
    print(f"   - Email: {email}")
    print(f"   - Số lần lặp: {num_iterations}")
    print(f"   - Số thread: {num_threads}")
    print(f"   - Output file: {output_file}")
    print("-" * 60)
    
    successful_registrations = []
    iteration_results = []  # Lưu kết quả từng iteration để in ra console
    
    # Đăng nhập một lần trước khi bắt đầu vòng lặp
    print("🔐 Đang đăng nhập...")
    client = StressTestClient(base_url, email, password)
    if not client.login():
        print("❌ Không thể đăng nhập. Dừng stress test.")
        return
    print("✅ Đăng nhập thành công!")
    print("-" * 60)
    
    def run_single_iteration(iteration_num: int, client: StressTestClient):
        """Chạy một lần lặp: đăng ký và hủy"""
        iteration_start_time = time.time()
        
        # Thực hiện flow đăng ký
        success, duration, registration_id, section_id = client.execute_full_registration_flow()
        
        if success:
            if registration_id:
                successful_registrations.append((iteration_num, registration_id))
            
            # Hủy đăng ký ngay sau đó (dùng registrationId hoặc sectionId)
            cancel_start = time.time()
            cancel_success = client.cancel_registration(registration_id, section_id)
            cancel_duration = time.time() - cancel_start
            
            total_duration = time.time() - iteration_start_time
            iteration_end_time = time.time()
            return iteration_start_time, iteration_end_time, total_duration, True
        else:
            total_duration = time.time() - iteration_start_time
            iteration_end_time = time.time()
            return iteration_start_time, iteration_end_time, total_duration, False
    
    # Chạy stress test
    test_start_time = time.time()
    test_start_datetime = datetime.fromtimestamp(test_start_time).strftime('%Y-%m-%d %H:%M:%S')
    
    if num_threads == 1:
        # Chạy tuần tự
        for i in range(1, num_iterations + 1):
            iter_start, iter_end, total_duration, success = run_single_iteration(i, client)
            if iter_start is not None:
                iteration_results.append({
                    'duration': total_duration,
                    'success': success
                })
                
                status = "✅" if success else "❌"
                print(f"{status} Lần {i}: Tổng thời gian={total_duration:.3f}s")
    else:
        # Chạy song song với ThreadPoolExecutor
        # Lưu ý: Với multi-threading, mỗi thread cần một client riêng với session riêng
        def run_single_iteration_with_new_client(iteration_num: int):
            """Tạo client mới cho mỗi thread (vì requests.Session không thread-safe)"""
            thread_client = StressTestClient(base_url, email, password)
            # Đăng nhập cho thread này
            if not thread_client.login():
                return None, None, None, False
            return run_single_iteration(iteration_num, thread_client)
        
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = {executor.submit(run_single_iteration_with_new_client, i): i for i in range(1, num_iterations + 1)}
            
            for future in as_completed(futures):
                iteration_num = futures[future]
                try:
                    iter_start, iter_end, total_duration, success = future.result()
                    if iter_start is not None:
                        iteration_results.append({
                            'duration': total_duration,
                            'success': success
                        })
                        
                        status = "✅" if success else "❌"
                        print(f"{status} Lần {iteration_num}: Tổng thời gian={total_duration:.3f}s")
                except Exception as e:
                    print(f"❌ Lỗi trong iteration {iteration_num}: {e}")
    
    test_end_time = time.time()
    test_end_datetime = datetime.fromtimestamp(test_end_time).strftime('%Y-%m-%d %H:%M:%S')
    total_test_duration = test_end_time - test_start_time
    
    # Tính toán thống kê
    successful_count = sum(1 for r in iteration_results if r.get('success', False))
    failed_count = len(iteration_results) - successful_count
    avg_duration = sum(r['duration'] for r in iteration_results) / len(iteration_results) if iteration_results else 0
    min_duration = min((r['duration'] for r in iteration_results), default=0)
    max_duration = max((r['duration'] for r in iteration_results), default=0)
    
    # Lưu kết quả vào CSV - chỉ 1 dòng cho mỗi lần chạy test
    # Kiểm tra xem file đã tồn tại chưa để quyết định có ghi header không
    file_exists = os.path.exists(output_file)
    
    with open(output_file, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['test_start_time', 'test_end_time', 'total_duration', 'num_iterations', 'num_threads', 'successful_count', 'failed_count', 'avg_duration', 'min_duration', 'max_duration']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        # Chỉ ghi header nếu file chưa tồn tại
        if not file_exists:
            writer.writeheader()
        
        # Ghi 1 dòng tổng hợp cho toàn bộ test
        writer.writerow({
            'test_start_time': test_start_datetime,
            'test_end_time': test_end_datetime,
            'total_duration': f"{total_test_duration:.3f}",
            'num_iterations': num_iterations,
            'num_threads': num_threads,
            'successful_count': successful_count,
            'failed_count': failed_count,
            'avg_duration': f"{avg_duration:.3f}",
            'min_duration': f"{min_duration:.3f}",
            'max_duration': f"{max_duration:.3f}"
        })
    
    # In thống kê
    print("-" * 60)
    print(f"📊 Thống kê:")
    print(f"   - Tổng số lần test: {len(iteration_results)}")
    print(f"   - Số lần thành công: {successful_count}")
    print(f"   - Số lần thất bại: {failed_count}")
    if iteration_results:
        print(f"   - Thời gian trung bình: {avg_duration:.3f}s")
        print(f"   - Thời gian nhanh nhất: {min_duration:.3f}s")
        print(f"   - Thời gian chậm nhất: {max_duration:.3f}s")
    print(f"   - Tổng thời gian test: {total_test_duration:.3f}s")
    print(f"   - Kết quả đã lưu vào: {output_file}")


def main():
    # Đọc giá trị mặc định từ config nếu có
    default_url = getattr(config, 'BASE_URL', 'http://localhost:3000') if config else 'http://localhost:3000'
    default_email = getattr(config, 'EMAIL', None) if config else None
    default_password = getattr(config, 'PASSWORD', None) if config else None
    default_iterations = getattr(config, 'NUM_ITERATIONS', 10) if config else 10
    default_threads = getattr(config, 'NUM_THREADS', 1) if config else 1
    default_output = getattr(config, 'OUTPUT_FILE', 'distribution.csv') if config else 'distribution.csv'
    
    parser = argparse.ArgumentParser(description='Stress Test cho Flow Đăng ký Tín chỉ')
    parser.add_argument('--url', type=str, default=default_url,
                       help=f'Base URL của backend API (default: {default_url})')
    parser.add_argument('--email', type=str, default=default_email,
                       required=default_email is None,
                       help='Email để đăng nhập' + (f' (default từ config: {default_email})' if default_email else ''))
    parser.add_argument('--password', type=str, default=default_password,
                       required=default_password is None,
                       help='Password để đăng nhập' + (f' (default từ config)' if default_password else ''))
    parser.add_argument('--iterations', type=int, default=default_iterations,
                       help=f'Số lần lặp lại (default: {default_iterations})')
    parser.add_argument('--threads', type=int, default=default_threads,
                       help=f'Số thread chạy đồng thời (default: {default_threads})')
    parser.add_argument('--output', type=str, default=default_output,
                       help=f'Tên file CSV output (default: {default_output})')
    
    args = parser.parse_args()
    
    # Validate required arguments
    if not args.email:
        parser.error("--email là bắt buộc nếu không có trong config.py")
    if not args.password:
        parser.error("--password là bắt buộc nếu không có trong config.py")
    
    run_stress_test(
        base_url=args.url,
        email=args.email,
        password=args.password,
        num_iterations=args.iterations,
        num_threads=args.threads,
        output_file=args.output
    )


if __name__ == "__main__":
    main()
