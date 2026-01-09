"""
Locust Stress Test cho Flow Đăng ký Tín chỉ
Giả lập 100 người dùng đồng thời đăng ký tín chỉ
"""

from locust import HttpUser, task, between
import random
import threading
from typing import Dict, List, Optional


class RegistrationUser(HttpUser):
    """
    Locust User class để giả lập người dùng đăng ký tín chỉ
    Mỗi user sẽ có tài khoản riêng: student{i}@gmail.com với password 'password'
    """
    
    # Thời gian chờ giữa các task (1-3 giây)
    wait_time = between(1, 3)
    
    # Class variable để đếm số user đã được tạo (thread-safe)
    _user_counter = 0
    _counter_lock = threading.Lock()
    
    def on_start(self):
        """Được gọi khi một user bắt đầu - thực hiện đăng nhập"""
        # Gán user_id từ 101-1101
        with RegistrationUser._counter_lock:
            RegistrationUser._user_counter += 1
            self.user_id = ((RegistrationUser._user_counter - 1) % 1000) + 101
        
        self.email = f"student{self.user_id}@gmail.com"
        self.password = "password"
        self.access_token: Optional[str] = None
        self.student_id: Optional[int] = None
        print(self.email, self.password, self.user_id)
        # Đăng nhập
        self.login()
    
    def login(self):
        """Đăng nhập và lấy JWT token"""
        with self.client.post(
            "/auth/login",
            json={"email": self.email, "password": self.password},
            catch_response=True,
            name="Login"
        ) as response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    # Xử lý response format (có thể có success wrapper hoặc không)
                    if isinstance(data, dict):
                        if 'data' in data and isinstance(data['data'], dict):
                            result = data['data']
                        else:
                            result = data
                        
                        self.access_token = result.get('accessToken') or result.get('access_token')
                        if self.access_token:
                            # Lấy student ID nếu có
                            student = result.get('student')
                            if student and isinstance(student, dict):
                                self.student_id = student.get('id') or student.get('studentId')
                            
                            # Set header cho các request tiếp theo
                            self.client.headers.update({
                                'Authorization': f'Bearer {self.access_token}',
                                'Content-Type': 'application/json'
                            })
                            response.success()
                        else:
                            response.failure(f"Không tìm thấy access token trong response")
                    else:
                        response.failure(f"Response không phải là dict: {data}")
                except Exception as e:
                    response.failure(f"Lỗi parse response: {e}")
            else:
                response.failure(f"Login failed with status {response.status_code}")
    
    def get_my_schedule(self) -> Optional[Dict]:
        """Bước 1: Lấy lịch học hiện tại"""
        with self.client.get(
            "/registrations/my-schedule",
            catch_response=True,
            name="Get My Schedule"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    schedule = data.get('data') if isinstance(data, dict) and 'data' in data else data
                    response.success()
                    return schedule
                except Exception as e:
                    response.failure(f"Lỗi parse response: {e}")
                    return None
            else:
                response.failure(f"Get schedule failed with status {response.status_code}")
                return None
    
    def get_available_courses(self) -> Optional[List[Dict]]:
        """Bước 2: Lấy danh sách môn học có sẵn"""
        with self.client.get(
            "/temporaries/available-courses",
            catch_response=True,
            name="Get Available Courses"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    courses = data.get('data') if isinstance(data, dict) and 'data' in data else data
                    if isinstance(courses, list):
                        response.success()
                        return courses
                    response.success()
                    return []
                except Exception as e:
                    response.failure(f"Lỗi parse response: {e}")
                    return None
            else:
                response.failure(f"Get courses failed with status {response.status_code}")
                return None
    
    def get_course_sections(self, course_id: int, page: int = 1, limit: int = 10) -> Optional[Dict]:
        """Bước 3: Lấy danh sách lớp học phần của môn học"""
        with self.client.get(
            f"/course-sections/course/{course_id}",
            params={"page": page, "limit": limit},
            catch_response=True,
            name="Get Course Sections"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    sections_data = data.get('data') if isinstance(data, dict) and 'data' in data else data
                    response.success()
                    return sections_data
                except Exception as e:
                    response.failure(f"Lỗi parse response: {e}")
                    return None
            else:
                response.failure(f"Get sections failed with status {response.status_code}")
                return None
    
    def register_section(self, section_id: int) -> bool:
        """Bước 4: Đăng ký học phần"""
        with self.client.post(
            "/registrations",
            json={"sectionId": section_id},
            catch_response=True,
            name="Register Section"
        ) as response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    # Chỉ coi là lỗi nếu có key 'error' trong response
                    # (Response thành công có thể có 'message' nhưng không phải lỗi)
                    if isinstance(data, dict) and 'error' in data:
                        error_msg = data.get('error', 'Unknown error')
                        response.failure(f"Đăng ký thất bại: {error_msg}")
                        return False
                    # Nếu không có 'error' thì coi như thành công
                    response.success()
                    return True
                except Exception as e:
                    # Nếu không parse được nhưng status code là 200/201 thì coi như thành công
                    response.success()
                    return True
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', error_data.get('error', f'Status {response.status_code}'))
                    response.failure(f"Đăng ký thất bại: {error_msg}")
                except:
                    response.failure(f"Đăng ký thất bại với status {response.status_code}")
                return False
    
    @task
    def execute_registration_flow(self):
        """
        Task chính: Thực hiện flow đăng ký đầy đủ
        Locust sẽ gọi task này liên tục cho đến khi dừng
        """
        # Bước 1: Xem lịch học hiện tại
        schedule = self.get_my_schedule()
        if schedule is None:
            return
        
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
            return
        
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
            unregistered_courses = courses
        
        if not unregistered_courses:
            return
        
        # Bước 3: Chọn môn học ngẫu nhiên từ danh sách chưa đăng ký
        selected_course = random.choice(unregistered_courses)
        course_id = selected_course.get('courseId') or selected_course.get('course', {}).get('courseId')
        if not course_id:
            # Thử tìm trong nested structure
            if 'course' in selected_course and isinstance(selected_course['course'], dict):
                course_id = selected_course['course'].get('courseId')
        
        if not course_id:
            return
        
        sections_data = self.get_course_sections(course_id)
        if not sections_data:
            return
        
        # Lấy danh sách sections
        sections = sections_data.get('data', []) if isinstance(sections_data, dict) else sections_data
        if not isinstance(sections, list) or len(sections) == 0:
            return
        
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
            return
        
        # Bước 4: Đăng ký học phần (KHÔNG hủy sau khi đăng ký)
        self.register_section(section_id)

