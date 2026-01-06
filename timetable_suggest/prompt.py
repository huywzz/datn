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
        "description": "Sắp xếp thời khoá biểu các môn học hợp lý đạt tổng score cao",
        "parameters": {
            "type": "object",
            "properties": {
                "scores": {
                    "type": "object",
                    "description": "Object mapping mapping sectionId (string) to score (number from -1.0 to 1.0). Ví dụ: '{\"1\": 0.95, \"2\": 0.87, \"3\": -1.0}'"
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
    prompt = """
THÔNG TIN CÁC SECTION HỌC PHẦN:
Mỗi section được biểu diễn trên 1 dòng, các field được ngăn cách bởi ký tự | theo đúng thứ tự sau:
sectionId | courseName | sectionCode | credits | instructor | schedules
Trong đó:
- sectionId: ID của section
- courseName: tên môn học
- sectionCode: mã lớp học phần
- credits: số tín chỉ
- instructor: tên giảng viên
- schedules: danh sách lịch học, mỗi lịch có dạng:
  Thứ-X(tiết_bắt_đầu-tiết_kết_thúc)[phòng]
  - Nếu nhiều lịch, ngăn cách bởi dấu ;

Ví dụ:
31 | Lập Trình Căn Bản | LTCB-01 | 3 | Nguyễn Văn A | Thứ-2(1-3)[A101]; Thứ-4(4-6)[A101]

DANH SÁCH SECTION
"""
    # Add course sections information (pipe-separated format)
    for section in flattened_sections:
        s = section.to_dict()
        day_map = {
            '1': '2',
            '2': '3',
            '3': '4',
            '4': '5',
            '5': '6',
            '6': '7'
        }
        schedules = []
        for sch in s.get('schedules', []):
            day = day_map.get(str(sch.get('dayOfWeek', '')), sch.get('dayOfWeek', ''))
            schedule_text = (
                f"Thứ-{day}("
                f"{sch.get('startPeriod', 0)}-{sch.get('endPeriod', 0)})"
            )
            if sch.get('room'):
                schedule_text += f"[{sch.get('room')}]"
            schedules.append(schedule_text)

        schedules_str = "; ".join(schedules) if schedules else "Chưa có lịch"

        prompt += (
            f"{s['sectionId']} | "
            f"{s['courseName']} | "
            f"{s['sectionCode']} | "
            f"{s['credits']} | "
            f"{s['instructorName']} | "
            f"{schedules_str}\n"
        )

    prompt += f"""

MONG MUỐN CỦA SINH VIÊN:
{preferences if preferences else "Không có yêu cầu đặc biệt"}

NHIỆM VỤ:
Nếu mong muốn của sinh viên liên quan tới sắp xếp lớp học phần/thời khoá biểu thì tôi sẽ
sử dụng function score_course_sections nếu không thì phản hồi text "không thể thực hiện yêu cầu". 
Tôi cần bạn dựa vào input, hãy đánh giá và cho điểm từng section học phần dựa trên mức độ phù hợp với mong muốn của sinh viên và trả về kết quả để gọi function call

QUY TẮC CHẤM ĐIỂM
- Điểm ∈ [-1, 1], làm tròn 2 chữ số
- BẮT BUỘC trả về đủ TẤT CẢ sectionId

GỢI Ý:
+1.0 : Rất phù hợp (đúng mong muốn, lịch đẹp)
0.5–0.8 : Phù hợp
0.1–0.4 : Ít phù hợp
0.0 : Không phù hợp 
-1.0: Sinh viên KHÔNG MUỐN CHỌN nếu:
    - Trái mong muốn sinh viên 
    - Sinh viên không muốn học môn này, giảng viên này, tiết ngày, ngày này...
    - Sinh viên dùng từ "tuyệt đối không, không được" để chỉ định những học phần này
"""

    return prompt
