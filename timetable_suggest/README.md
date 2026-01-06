# Timetable Suggest API

Flask API để xử lý và flatten dữ liệu course sections cho Gemini API.

## Cài đặt

```bash
pip install -r requirements.txt
```

## Chạy ứng dụng

```bash
python app.py
```

API sẽ chạy tại `http://localhost:5000`

## Endpoints

### POST /suggest-timetable

Nhận vào danh sách course sections (giống như `findAll()` của course section service) và mong muốn của sinh viên, sau đó trả về danh sách gợi ý thời khóa biểu đã được xử lý bởi SuggestService.

**Request Body:**
```json
{
  "courseSections": [
    {
      "sectionId": 1,
      "sectionCode": "CS101-01",
      "courseId": 1,
      "instructorId": 1,
      "maxStudents": 50,
      "currentStudents": 30,
      "status": "open",
      "semesterId": 1,
      "course": {
        "courseId": 1,
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "credits": 3
      },
      "instructor": {
        "instructorId": 1,
        "fullName": "Nguyen Van A",
        "department": "Computer Science",
        "title": "Professor"
      },
      "classSchedules": [
        {
          "scheduleId": 1,
          "dayOfWeek": "1",
          "startPeriod": 1,
          "endPeriod": 3,
          "room": "A101"
        }
      ]
    }
  ],
  "studentPreferences": "Tôi muốn học vào buổi sáng, không học thứ 7, và muốn đăng ký các môn CS101, MATH201"
}
```

**Lưu ý:**
- `courseSections` (bắt buộc): Danh sách các course sections
- `studentPreferences` (tùy chọn): Mong muốn của sinh viên về thời khóa biểu (string)

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "sectionId": 1,
      "sectionCode": "CS101-01",
      "courseName": "Introduction to Computer Science",
      "credits": 3,
      "instructorName": "Nguyen Van A",
      "schedules": [
        {
          "dayOfWeek": "1",
          "startPeriod": 1,
          "endPeriod": 3,
          "room": "A101"
        }
      ],
      "matchScore": 1.0,
      "reason": "Suggested based on availability"
    }
  ],
  "totalSections": 1,
  "preferences": "Tôi muốn học vào buổi sáng, không học thứ 7",
  "count": 1
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "timetable-suggest-api"
}
```

## Cấu trúc Code

### Models (`models.py`)

API sử dụng các class models để quản lý dữ liệu:

- **`Course`**: Model cho thông tin khóa học
  - `courseId`, `code`, `name`, `credits`
  - Method: `from_dict()` để parse từ dictionary

- **`Instructor`**: Model cho thông tin giảng viên
  - `instructorId`, `fullName`, `department`, `title`
  - Method: `from_dict()` để parse từ dictionary

- **`ClassSchedule`**: Model cho lịch học
  - `dayOfWeek`, `startPeriod`, `endPeriod`, `room`
  - Methods: `from_dict()`, `to_dict()`

- **`CourseSection`**: Model cho section của khóa học
  - Chứa thông tin section và các relations (course, instructor, classSchedules)
  - Method: `from_dict()` để parse từ dictionary

- **`CourseFlatten`**: Model cho dữ liệu đã được flatten
  - Chỉ chứa các trường cần thiết: `sectionId`, `sectionCode`, `courseName`, `credits`, `instructorName`, `schedules`
  - Methods: `from_course_section()`, `to_dict()`

### Suggest Service (`suggest_service.py`)

Service để xử lý logic gợi ý thời khóa biểu:

- **`SuggestService`**: Service class cho việc gợi ý thời khóa biểu
  - Method `suggest(flattened_data, preferences)`: Nhận vào danh sách course sections đã flatten và preferences của sinh viên, trả về danh sách gợi ý
  - Method `_generate_suggestions()`: Method nội bộ để generate suggestions (sẽ được thay thế bằng Gemini API)
  - Method `_call_gemini_api()`: Method để gọi Gemini API (chưa implement)

### Flatten Course Sections

Hàm `flatten_course_sections()` sẽ:
1. Parse từng course section từ dictionary thành `CourseSection` object
2. Chuyển đổi `CourseSection` thành `CourseFlatten` object
3. Trả về danh sách dictionary đã được flatten

Chỉ giữ lại các trường cần thiết cho Gemini API:
- `sectionId`: ID của section
- `sectionCode`: Mã section
- `courseName`: Tên khóa học
- `credits`: Số tín chỉ
- `instructorName`: Tên giảng viên
- `schedules`: Danh sách lịch học (dayOfWeek, startPeriod, endPeriod, room)

## Testing

### Sử dụng Python test script

```bash
python test_api.py
```

Script này sẽ test:
- Health check endpoint
- Suggest timetable với dữ liệu hợp lệ
- Suggest timetable với dữ liệu rỗng
- Suggest timetable với dữ liệu không hợp lệ

### Sử dụng curl (Linux/Mac)

```bash
chmod +x test_curl.sh
./test_curl.sh
```

### Sử dụng curl (Windows)

```bash
test_curl.bat
```

### Test thủ công với curl

```bash
# Health check
curl -X GET http://localhost:5000/health

# Suggest timetable
curl -X POST http://localhost:5000/suggest-timetable \
  -H "Content-Type: application/json" \
  -d @example_request.json
```

### Test với example_request.json

File `example_request.json` chứa dữ liệu mẫu để test API. Bạn có thể sử dụng file này để test thủ công hoặc tích hợp vào các test case khác.

