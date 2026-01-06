"""
Prompt template for Gemini API
"""
from typing import List, Dict, Any
from models import CourseFlatten


def get_score_sections_function_schema() -> Dict[str, Any]:
    """
    Get function schema for scoring course sections.
    
    Returns:
        Function schema dictionary for Gemini API function calling
    """
    return {
        "name": "score_course_sections",
        "description": "Đánh giá và cho điểm các section học phần dựa trên mong muốn của sinh viên. Điểm từ -1 đến 1.0, trong đó 0.0 = không phù hợp, 1.0 = rất phù hợp, -1 là không muốn chọn.",
        "parameters": {
            "type": "object",
            "properties": {
                "scores": {
                    "type": "string",
                    "description": "JSON string mapping sectionId (string) to score (number from -1 to 1.0). Ví dụ: '{\"1\": 0.95, \"2\": 0.87}'"
                }
            },
            "required": ["scores"]
        }
    }


def build_prompt(flattened_sections: List[CourseFlatten], preferences: str) -> str:
    """
    Build prompt for Gemini API to score course sections based on student preferences.
    
    Args:
        flattened_sections: List of CourseFlatten objects
        preferences: Student preferences as a string
        
    Returns:
        Formatted prompt string
    """
    prompt = """Bạn là một hệ thống tư vấn đăng ký học phần thông minh. 
Nhiệm vụ của bạn là đánh giá và cho điểm các section học phần dựa trên mong muốn của sinh viên.

THÔNG TIN CÁC SECTION HỌC PHẦN:
"""

    # Add course sections information
    for section in flattened_sections:
        section_dict = section.to_dict()
        schedules_text = []
        for schedule in section_dict.get('schedules', []):
            day_map = {
                '1': 'Thứ 2',
                '2': 'Thứ 3',
                '3': 'Thứ 4',
                '4': 'Thứ 5',
                '5': 'Thứ 6',
                '6': 'Thứ 7'
            }
            day_text = day_map.get(schedule.get('dayOfWeek', ''), f"Thứ {schedule.get('dayOfWeek', '')}")
            period_text = f"Tiết {schedule.get('startPeriod', 0)}-{schedule.get('endPeriod', 0)}"
            room_text = f" - Phòng {schedule.get('room', '')}" if schedule.get('room') else ""
            schedules_text.append(f"{day_text} ({period_text}){room_text}")

        schedules_str = "; ".join(schedules_text) if schedules_text else "Chưa có lịch"

        prompt += f"""
- Section ID: {section_dict['sectionId']}
  Mã section: {section_dict['sectionCode']}
  Tên môn học: {section_dict['courseName']}
  Số tín chỉ: {section_dict['credits']}
  Giảng viên: {section_dict['instructorName']}
  Lịch học: {schedules_str}
"""

    prompt += f"""

MONG MUỐN CỦA SINH VIÊN:
{preferences if preferences else "Không có yêu cầu đặc biệt"}

NHIỆM VỤ:
Hãy đánh giá và cho điểm từng section học phần dựa trên:
1. Mức độ phù hợp với mong muốn của sinh viên
2. Chất lượng giảng viên (nếu có thông tin)
3. Lịch học có thuận tiện không
4. Các yếu tố khác có thể ảnh hưởng đến quyết định đăng ký

ĐIỂM SỐ:
- Điểm từ -1 đến 1.0 (-1 = không được chọn, 0.0 = không phù hợp, 1.0 = rất phù hợp)
- Làm tròn đến 2 chữ số thập phân

Hãy sử dụng function score_course_sections để trả về kết quả đánh giá. 
Function này sẽ nhận một dictionary với key là sectionId (string) và value là điểm số (float từ -1 đến 1.0).

Ví dụ:
- Section ID 1 phù hợp cao: điểm 0.95
- Section ID 2 phù hợp trung bình: điểm 0.70
- Section ID 3 không phù hợp: điểm 0.30
- Section ID 4 không được chọn: -1 (giả sử mong muốn không học môn này hoặc là không muốn học với giảng viên này)
"""

    return prompt
