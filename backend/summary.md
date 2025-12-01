# TÓM TẮT LOGIC DỰ ÁN - HỆ THỐNG ĐĂNG KÝ HỌC PHẦN

## 1. Ý NGHĨA

Dự án là một **Hệ thống quản lý đăng ký học phần** (Course Registration Management System) cho trường đại học/cao đẳng, được xây dựng bằng NestJS và TypeORM với MySQL.

### Mục đích chính:
- Quản lý đăng ký học phần cho sinh viên
- Quản lý lịch học và lớp học phần
- Hỗ trợ trao đổi học phần giữa các sinh viên
- Quản lý thời gian đăng ký học phần
- Quản lý khóa học, học kỳ, và khóa đào tạo

### Đối tượng sử dụng:
- **Sinh viên (Student)**: Đăng ký học phần, xem lịch học, trao đổi học phần
- **Quản trị viên (Admin)**: Quản lý toàn bộ hệ thống, tạo lớp học phần, quản lý sinh viên
- **Giảng viên (Teacher)**: (Được định nghĩa trong enum nhưng chưa có chức năng cụ thể)

---

## 2. DATABASE

### 2.1. Cấu trúc Database

Hệ thống sử dụng **MySQL** với TypeORM, bao gồm các bảng chính:

#### **Bảng Users (users)**
- `user_id` (PK): ID người dùng
- `name`: Tên người dùng
- `email`: Email (unique)
- `password`: Mật khẩu (nullable - hỗ trợ đăng nhập Google)
- `role`: Vai trò (admin, student, teacher)
- `status`: Trạng thái hoạt động
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: One-to-One với `students`

#### **Bảng Students (students)**
- `student_id` (PK): ID sinh viên
- `user_id` (FK): Tham chiếu đến users
- `student_code`: Mã sinh viên (unique)
- `full_name`: Họ tên đầy đủ
- `class_code`: Mã lớp
- `major`: Chuyên ngành
- `year_of_study`: Năm học
- `current_year`: Năm hiện tại
- `current_semester`: Học kỳ hiện tại (FK đến semesters)
- `cohort_id` (FK): Khóa đào tạo
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: 
- Many-to-One với `cohorts`
- Many-to-One với `semesters` (qua current_semester)
- One-to-One với `users`

#### **Bảng Cohorts (cohorts)**
- `id` (PK): ID khóa đào tạo (varchar)
- `code`: Mã khóa
- `name`: Tên khóa
- `start_year`: Năm bắt đầu
- `end_year`: Năm kết thúc
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: One-to-Many với `students`

#### **Bảng Semesters (semesters)**
- `semester_id` (PK): ID học kỳ
- `start_date`: Ngày bắt đầu
- `end_date`: Ngày kết thúc
- `status`: Trạng thái (active, inactive)
- `created_at`, `updated_at`: Timestamp
- `deleted_at`: Soft delete

**Quan hệ**: 
- One-to-Many với `students` (qua current_semester)
- One-to-Many với `course_sections`

#### **Bảng Courses (courses)**
- `course_id` (PK): ID môn học
- `code`: Mã môn học
- `name`: Tên môn học
- `credits`: Số tín chỉ
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: One-to-Many với `course_sections`

#### **Bảng Instructors (instructors)**
- `instructor_id` (PK): ID giảng viên
- `full_name`: Họ tên
- `department`: Khoa/Bộ môn
- `title`: Chức danh (nullable)
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: One-to-Many với `course_sections`

#### **Bảng Course Sections (course_sections)**
- `section_id` (PK): ID lớp học phần
- `section_code`: Mã lớp học phần
- `course_id` (FK): Môn học
- `instructor_id` (FK): Giảng viên
- `max_students`: Số lượng sinh viên tối đa
- `current_students`: Số lượng sinh viên hiện tại
- `schedule`: Lịch học (varchar, nullable)
- `status`: Trạng thái (open, closed, full)
- `semester_id` (FK): Học kỳ (nullable)
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: 
- Many-to-One với `courses`
- Many-to-One với `instructors`
- Many-to-One với `semesters`
- One-to-Many với `class_schedules`
- One-to-Many với `registrations`
- One-to-Many với `exchange_requests` (fromSection và desiredSection)

#### **Bảng Class Schedules (class_schedules)**
- `schedule_id` (PK): ID lịch học
- `section_id` (FK): Lớp học phần
- `day_of_week`: Thứ trong tuần (1-6: Thứ 2 - Thứ 7)
- `start_period`: Tiết bắt đầu (1-9)
- `end_period`: Tiết kết thúc (1-9)
- `room`: Phòng học (nullable)
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: Many-to-One với `course_sections`

#### **Bảng Registrations (registrations)**
- `registration_id` (PK): ID đăng ký
- `student_id` (FK): Sinh viên
- `section_id` (FK): Lớp học phần
- `registered_at`: Thời gian đăng ký
- `status`: Trạng thái (active, pending, approved, rejected)
- `semester`: Học kỳ
- `created_at`, `updated_at`: Timestamp
- `deleted_at`: Soft delete

**Quan hệ**: 
- Many-to-One với `students`
- Many-to-One với `course_sections`

#### **Bảng Exchange Requests (exchange_requests)**
- `exchange_id` (PK): ID yêu cầu trao đổi
- `requester_id` (FK): Sinh viên yêu cầu trao đổi
- `from_section_id` (FK): Lớp học phần hiện tại
- `desired_section_id` (FK): Lớp học phần mong muốn
- `accepter_id` (FK): Sinh viên chấp nhận trao đổi (nullable)
- `status`: Trạng thái (pending, matched, accepted, completed)
- `matched_at`: Thời gian khớp
- `accepted_at`: Thời gian chấp nhận
- `completed_at`: Thời gian hoàn thành
- `created_at`, `updated_at`: Timestamp

**Quan hệ**: 
- Many-to-One với `students` (requester và accepter)
- Many-to-One với `course_sections` (fromSection và desiredSection)

#### **Bảng Temporaries (temporaries)**
- `id` (PK): ID bản ghi tạm
- `course_id` (FK): Môn học
- `cohort_id` (FK): Khóa đào tạo
- `status`: Trạng thái (active)
- `created_at`, `updated_at`: Timestamp
- `deleted_at`: Soft delete

**Quan hệ**: 
- Many-to-One với `courses`
- Many-to-One với `cohorts`

**Mục đích**: Lưu trữ danh sách môn học có sẵn cho từng khóa đào tạo, được import từ Excel.

#### **Bảng Course Registration Periods (course_registration_periods)**
- `id` (PK): ID thời kỳ đăng ký
- `start_time`: Thời gian bắt đầu đăng ký
- `end_time`: Thời gian kết thúc đăng ký
- `status`: Trạng thái (boolean - chỉ có 1 period active tại một thời điểm)
- `created_at`, `updated_at`: Timestamp

**Mục đích**: Quản lý thời gian cho phép sinh viên đăng ký học phần.

### 2.2. Ràng buộc và Quy tắc

- **Unique Constraints**: 
  - `users.email` (unique)
  - `students.student_code` (unique)
  
- **Foreign Key Constraints**:
  - CASCADE delete cho quan hệ User-Student
  - RESTRICT delete cho quan hệ Student-Cohort, Student-Semester
  - CASCADE delete cho Registration, ExchangeRequest

- **Soft Delete**: 
  - `registrations` (deleted_at)
  - `semesters` (deleted_at)
  - `temporaries` (deleted_at)

---

## 3. API

### 3.1. Authentication APIs (`/auth`)

#### `POST /auth/register`
- **Mô tả**: Đăng ký tài khoản mới (admin hoặc student)
- **Request Body**: 
  - `name`, `email`, `password`, `role`
  - Nếu role = student: `studentCode`, `classCode`, `major`, `yearOfStudy`, `currentYear`, `currentSemester`, `cohortId`
- **Response**: `{ user, student?, accessToken }`
- **Validation**: 
  - Email phải unique
  - Cohort phải tồn tại (nếu là student)
  - Password được hash bằng bcrypt

#### `POST /auth/login`
- **Mô tả**: Đăng nhập bằng email/password
- **Request Body**: `email`, `password`
- **Response**: `{ user, student?, accessToken }`
- **Validation**: 
  - Kiểm tra email và password
  - Kiểm tra user status
  - Role phải là admin hoặc student

#### `POST /auth/login/google`
- **Mô tả**: Đăng nhập bằng Google OAuth
- **Request Body**: `idToken` (Google ID token)
- **Response**: `{ user, accessToken }`
- **Logic**: 
  - Verify Google token
  - Tạo user mới nếu chưa tồn tại
  - Trả về JWT token

### 3.2. User & Student APIs

#### `POST /students/register`
- **Mô tả**: Đăng ký sinh viên (tương tự `/auth/register` với role=student)

#### `POST /students/login`
- **Mô tả**: Đăng nhập sinh viên

#### `GET /students?cohortId=xxx&name=xxx`
- **Mô tả**: Lấy danh sách sinh viên theo khóa và tên (tìm kiếm)

### 3.3. Course APIs (`/courses`)

#### `POST /courses`
- **Mô tả**: Tạo môn học mới
- **Request Body**: `code`, `name`, `credits`

#### `GET /courses?page=1&limit=10&search=xxx`
- **Mô tả**: Lấy danh sách môn học với pagination và tìm kiếm
- **Response**: `PaginatedResponseDto<Course>`

#### `GET /courses/:id`
- **Mô tả**: Lấy thông tin môn học theo ID

### 3.4. Course Section APIs (`/course-sections`)

#### `POST /course-sections`
- **Mô tả**: Tạo lớp học phần mới
- **Request Body**: `sectionCode`, `courseId`, `instructorId`, `maxStudents`, `schedule`, `status`

#### `GET /course-sections`
- **Mô tả**: Lấy tất cả lớp học phần

#### `GET /course-sections/search?page=1&limit=10&...`
- **Mô tả**: Tìm kiếm và lọc lớp học phần với pagination
- **Query Params**: `page`, `limit`, `courseId`, `instructorId`, `semesterId`, `status`, `search`

#### `GET /course-sections/course/:courseId?page=1&limit=10&semesterId=xxx`
- **Mô tả**: Lấy danh sách lớp học phần của một môn học với pagination và filter theo semester
- **Yêu cầu**: JWT authentication (Bearer token)
- **Role-based filtering**:
  - **Student**: Chỉ trả về sections có `status = 'open'` hoặc `'full'` (ẩn sections có status `'closed'`)
  - **Admin**: Trả về tất cả sections (không filter theo status)
- **Query Params**: 
  - `page`: Số trang (default: 1)
  - `limit`: Số lượng mỗi trang (default: 10)
  - `semesterId`: Filter theo học kỳ (optional)
  - `search`: Tìm kiếm theo sectionCode, course name, instructor name (optional)
- **Response**: `PaginatedResponseDto<CourseSection>` với relations (course, instructor, classSchedules)
- **Mục đích trong flow**: Sinh viên xem các lớp học phần có sẵn của môn học để chọn lớp phù hợp trước khi đăng ký

#### `GET /course-sections/:id/students?page=1&limit=10&search=xxx`
- **Mô tả**: Lấy danh sách sinh viên đã đăng ký trong một lớp học phần

#### `GET /course-sections/:id`
- **Mô tả**: Lấy thông tin lớp học phần theo ID

#### `POST /course-sections/import`
- **Mô tả**: Import lớp học phần từ file Excel
- **Request**: Multipart form với `file`, `semesterId`, `cohortId`
- **Logic**: 
  - Đọc file Excel
  - Tạo course, instructor nếu chưa có
  - Tạo course section và class schedules
  - Tạo temporary records cho cohort

### 3.5. Registration APIs (`/registrations`)

**Tất cả endpoints yêu cầu JWT authentication**

#### `POST /registrations`
- **Mô tả**: Đăng ký học phần
- **Request Body**: `sectionId`, `studentId?` (nếu admin)
- **Logic nghiệp vụ**:
  1. Kiểm tra thời gian đăng ký (CourseRegistrationPeriod phải active)
  2. Kiểm tra lớp học phần tồn tại và chưa đầy
  3. Kiểm tra sinh viên chưa đăng ký môn học này (1 sinh viên chỉ được đăng ký 1 section của 1 môn học)
  4. Kiểm tra trùng lịch học với các lớp đã đăng ký
  5. Sử dụng transaction với pessimistic lock để tránh race condition
  6. Tạo registration và tăng `currentStudents` của section

#### `GET /registrations`
- **Mô tả**: Lấy tất cả đăng ký (admin)

#### `GET /registrations/my-schedule`
- **Mô tả**: Lấy lịch học của sinh viên hiện tại
- **Yêu cầu**: JWT authentication (Bearer token)
- **Response**: Danh sách lịch học với thông tin section, course, schedule
- **Mục đích trong flow**: Bước đầu tiên trong flow đăng ký - sinh viên xem lịch học hiện tại để tránh trùng lịch khi đăng ký môn học mới

#### `GET /registrations/:id`
- **Mô tả**: Lấy thông tin đăng ký theo ID

#### `DELETE /registrations/:id`
- **Mô tả**: Hủy đăng ký
- **Logic**: 
  - Kiểm tra quyền (admin hoặc chính sinh viên đó)
  - Sử dụng transaction với pessimistic lock
  - Soft delete registration và giảm `currentStudents` của section

### 3.6. Exchange Request APIs (`/exchange-requests`)

#### `POST /exchange-requests`
- **Mô tả**: Tạo yêu cầu trao đổi học phần
- **Request Body**: `requesterId`, `fromSectionId`, `desiredSectionId`, `accepterId?`, `status?`

#### `GET /exchange-requests`
- **Mô tả**: Lấy tất cả yêu cầu trao đổi

#### `GET /exchange-requests/:id`
- **Mô tả**: Lấy thông tin yêu cầu trao đổi theo ID

**Lưu ý**: Chức năng matching tự động chưa được implement đầy đủ trong service.

### 3.7. Cohort APIs (`/cohorts`)

#### `POST /cohorts`
- **Mô tả**: Tạo khóa đào tạo mới
- **Request Body**: `id`, `code`, `name`, `startYear`, `endYear`

#### `GET /cohorts`
- **Mô tả**: Lấy tất cả khóa đào tạo

#### `GET /cohorts/:id`
- **Mô tả**: Lấy thông tin khóa đào tạo theo ID

#### `PUT /cohorts/:id`
- **Mô tả**: Cập nhật khóa đào tạo

#### `DELETE /cohorts/:id`
- **Mô tả**: Xóa khóa đào tạo

### 3.8. Semester APIs (`/semesters`)

#### `POST /semesters`
- **Mô tả**: Tạo học kỳ mới
- **Request Body**: `startDate`, `endDate`, `status?`

#### `GET /semesters`
- **Mô tả**: Lấy tất cả học kỳ

#### `GET /semesters/:id`
- **Mô tả**: Lấy thông tin học kỳ theo ID

#### `PATCH /semesters/:id`
- **Mô tả**: Cập nhật học kỳ

#### `DELETE /semesters/:id`
- **Mô tả**: Soft delete học kỳ

### 3.9. Temporary APIs (`/temporaries`)

#### `POST /temporaries`
- **Mô tả**: Tạo bản ghi temporary (môn học cho khóa đào tạo)

#### `GET /temporaries`
- **Mô tả**: Lấy tất cả bản ghi temporary

#### `GET /temporaries/available-courses`
- **Mô tả**: Lấy danh sách môn học có sẵn cho sinh viên hiện tại (dựa trên cohort)
- **Yêu cầu**: JWT authentication (Bearer token)
- **Logic**:
  1. Lấy thông tin Student từ userId trong JWT token
  2. Lấy cohortId của student
  3. Tìm tất cả Temporary records có:
     - `cohortId` = student.cohortId
     - `status` = 'active'
  4. Load relations: course
- **Response**: Danh sách Temporary records với thông tin course (courseId, code, name, credits)
- **Mục đích trong flow**: Bước 2 trong flow đăng ký - sinh viên xem các môn học có thể đăng ký trong kỳ này (dựa trên khóa đào tạo của mình) trước khi chọn môn học cụ thể

#### `GET /temporaries/:id`
- **Mô tả**: Lấy thông tin temporary theo ID

#### `POST /temporaries/import`
- **Mô tả**: Import danh sách môn học cho khóa đào tạo từ Excel
- **Request**: Multipart form với `file`, `registrationStartDate`, `registrationEndDate`

### 3.10. Course Registration Period APIs (`/course-registration-periods`)

#### `POST /course-registration-periods`
- **Mô tả**: Tạo thời kỳ đăng ký học phần
- **Request Body**: `startTime`, `endTime`, `status`

**Lưu ý**: Các endpoint GET, PUT, DELETE đã bị comment trong controller.

---

## 4. FLOW

### 4.1. Flow Đăng ký Tài khoản

```
1. User gửi POST /auth/register với thông tin:
   - Nếu role = student: cần thêm thông tin student (studentCode, cohortId, ...)
   
2. System validation:
   - Kiểm tra email chưa tồn tại
   - Nếu student: kiểm tra cohort tồn tại
   
3. Hash password bằng bcrypt

4. Transaction (nếu student):
   - Tạo User
   - Tạo Student (nếu role = student)
   
5. Generate JWT token

6. Return: { user, student?, accessToken }
```

### 4.2. Flow Đăng ký Học phần (Đăng ký Tín chỉ)

**Flow đầy đủ từ đầu đến cuối:**

```
Bước 1: Xem lịch học hiện tại
1. Student gửi GET /registrations/my-schedule
   - JWT token chứa userId
   
2. System trả về:
   - Danh sách các lớp học phần đã đăng ký
   - Lịch học chi tiết (thứ, tiết, phòng)
   - Thông tin môn học và section
   
3. Mục đích: Sinh viên xem lịch học hiện tại để tránh trùng lịch khi đăng ký mới

---

Bước 2: Xem các môn học có sẵn cho đăng ký trong kỳ này
1. Student gửi GET /temporaries/available-courses
   - JWT token chứa userId
   
2. System:
   a. Lấy thông tin Student từ userId
   b. Lấy cohortId của student
   c. Tìm tất cả Temporary records có:
      - cohortId = student.cohortId
      - status = 'active'
   d. Load relations: course
   
3. System trả về:
   - Danh sách các môn học (courses) có sẵn cho khóa đào tạo của sinh viên
   - Thông tin: courseId, course code, course name, credits
   
4. Mục đích: Sinh viên xem danh sách các môn học có thể đăng ký trong kỳ này (dựa trên khóa đào tạo)

---

Bước 3: Chọn môn học và xem các lớp học phần
1. Student chọn một môn học từ danh sách ở Bước 2 (courseId)
   
2. Student gửi GET /course-sections/course/:courseId?page=1&limit=10&semesterId=xxx
   - JWT token chứa userId và role
   - Query params: pagination, semesterId (optional)
   
3. System validation và filtering:
   a. Nếu role = STUDENT:
      - Chỉ trả về sections có status = 'open' hoặc 'full'
      - Ẩn các sections có status = 'closed'
   b. Nếu role = ADMIN:
      - Trả về tất cả sections (không filter theo status)
   
4. System trả về:
   - Danh sách các lớp học phần (sections) của môn học đó
   - Thông tin: sectionCode, instructor, maxStudents, currentStudents, status
   - Lịch học (classSchedules): thứ, tiết, phòng
   - Pagination metadata
   
5. Mục đích: Sinh viên xem các lớp học phần có sẵn của môn học và chọn lớp phù hợp

---

Bước 4: Đăng ký học phần
1. Student/Admin gửi POST /registrations với sectionId
   - Admin cần cung cấp studentId
   - Student tự động lấy từ JWT token

2. System validation:
   a. Kiểm tra CourseRegistrationPeriod đang active
   b. Kiểm tra section tồn tại và chưa đầy (currentStudents < maxStudents)
   c. Kiểm tra sinh viên chưa đăng ký môn học này:
      - Lấy tất cả registration của sinh viên trong semester hiện tại
      - Kiểm tra courseId không trùng
   d. Kiểm tra trùng lịch học:
      - Lấy tất cả classSchedules của các section đã đăng ký (từ Bước 1)
      - So sánh với classSchedules của section mới
      - Trùng nếu: cùng dayOfWeek và khoảng thời gian chồng chéo
        (newStart <= currentEnd AND newEnd >= currentStart)

3. Transaction với Pessimistic Lock:
   a. Lock section để đọc currentStudents
   b. Kiểm tra lại currentStudents < maxStudents
   c. Tạo Registration với status='active'
   d. Tăng currentStudents của section lên 1
   
4. Return: Registration với relations (student, section)

---

Tóm tắt Flow:
GET /registrations/my-schedule 
  → (Xem lịch hiện tại)
  → GET /temporaries/available-courses 
  → (Xem các môn học có sẵn cho đăng ký)
  → GET /course-sections/course/:courseId 
  → (Chọn lớp học phần)
  → POST /registrations 
  → (Đăng ký thành công)
```

### 4.3. Flow Hủy Đăng ký

```
1. User gửi DELETE /registrations/:id
   - Kiểm tra quyền: admin hoặc chính sinh viên đó

2. Transaction với Pessimistic Lock:
   a. Lock section
   b. Giảm currentStudents của section (tối thiểu = 0)
   c. Soft delete registration (deleted_at)
   
3. Return: Success
```

### 4.4. Flow Xem Lịch Học

```
1. Student gửi GET /registrations/my-schedule
   - JWT token chứa userId

2. System:
   a. Tìm Student từ userId
   b. Lấy tất cả Registration của student trong currentSemester với status='active'
   c. Load relations: section.classSchedules, section.course
   d. Flatten classSchedules với thông tin section và course
   
3. Return: {
     studentId, studentCode, fullName, currentSemester,
     schedules: [
       {
         registrationId, scheduleId,
         dayOfWeek, startPeriod, endPeriod, room,
         section: { sectionId, sectionCode, courseId, courseName, courseCode, instructorId }
       }
     ]
   }
```

### 4.5. Flow Import Course Sections từ Excel

```
1. Admin gửi POST /course-sections/import
   - Multipart form: file (Excel), semesterId, cohortId

2. System:
   a. Đọc file Excel bằng XLSX
   b. Parse từng row:
      - Section code, course (code hoặc name), instructor name
      - max student, day of week, start period, end period, room
   c. Với mỗi row:
      - Tìm hoặc tạo Course (từ code hoặc name)
      - Tìm hoặc tạo Instructor (từ name)
      - Tạo CourseSection với semesterId
      - Tạo ClassSchedule cho section
      - Tạo Temporary record (courseId, cohortId) nếu chưa có
   d. Sử dụng transaction để đảm bảo atomicity
   
3. Return: { success: số lượng thành công, errors: [] }
```

### 4.6. Flow Trao đổi Học phần (Exchange Request)

```
1. Student tạo yêu cầu trao đổi:
   POST /exchange-requests
   {
     requesterId: studentId,
     fromSectionId: section hiện tại,
     desiredSectionId: section mong muốn
   }

2. System tạo ExchangeRequest với status='pending'

3. (Chưa implement đầy đủ) Matching logic:
   - Tìm ExchangeRequest khác có:
     - fromSectionId = desiredSectionId của request hiện tại
     - desiredSectionId = fromSectionId của request hiện tại
     - status = 'pending'
   - Nếu tìm thấy: cập nhật cả 2 request với accepterId và status='matched'
   - Khi cả 2 bên accept: status='accepted' và thực hiện swap registration
   - Sau khi swap: status='completed'
```

### 4.7. Flow Quản lý Thời gian Đăng ký

```
1. Admin tạo CourseRegistrationPeriod:
   POST /course-registration-periods
   {
     startTime: datetime,
     endTime: datetime,
     status: true
   }
   
2. Khi sinh viên đăng ký:
   - System kiểm tra có CourseRegistrationPeriod với status=true
   - Kiểm tra thời gian hiện tại trong khoảng [startTime, endTime]
   - Nếu không: throw BadRequestException('Không có đăng ký được!')
```

### 4.8. Flow Tìm kiếm và Lọc Lớp Học phần

```
1. User gửi GET /course-sections/search?page=1&limit=10&courseId=xxx&semesterId=xxx&status=open

2. System:
   a. Build query với TypeORM QueryBuilder
   b. Apply filters:
      - courseId: WHERE course_id = ?
      - instructorId: WHERE instructor_id = ?
      - semesterId: WHERE semester_id = ?
      - status: WHERE status = ?
      - search: LIKE trên sectionCode, course.name, instructor.fullName
   c. Apply pagination: skip, take
   d. Load relations: course, instructor, classSchedules
   
3. Return: PaginatedResponseDto {
     data: CourseSection[],
     total: số lượng tổng,
     page: trang hiện tại,
     limit: số lượng mỗi trang,
     totalPages: tổng số trang
   }
```

### 4.9. Flow Xác thực JWT

```
1. User gửi request với header: Authorization: Bearer <token>

2. JwtAuthGuard:
   a. Extract token từ header
   b. Verify token với JwtStrategy
   c. Validate user từ database
   d. Attach user vào request (@CurrentUser())

3. RoleGuard (nếu có):
   - Kiểm tra role của user có phù hợp với endpoint không
```

### 4.10. Flow Import Temporary từ Excel

```
1. Admin gửi POST /temporaries/import
   - Multipart form: file (Excel), registrationStartDate, registrationEndDate

2. System:
   a. Đọc file Excel
   b. Parse rows: course code/name, cohort code/id
   c. Với mỗi row:
      - Tìm hoặc tạo Course
      - Tìm Cohort
      - Tạo Temporary record (courseId, cohortId, status='active')
   d. (registrationStartDate, registrationEndDate được nhận nhưng chưa được lưu)
   
3. Return: { success: số lượng, errors: [] }
```

---

## 5. CÁC TÍNH NĂNG ĐẶC BIỆT

### 5.1. Transaction và Concurrency Control
- Sử dụng **Pessimistic Lock** khi đăng ký/hủy học phần để tránh race condition
- Transaction đảm bảo atomicity khi tạo registration và update currentStudents

### 5.2. Soft Delete
- `registrations`, `semesters`, `temporaries` sử dụng soft delete (deleted_at)
- Cho phép khôi phục dữ liệu và giữ lịch sử

### 5.3. Pagination
- Hầu hết các API list đều hỗ trợ pagination với `page` và `limit`
- Response format: `PaginatedResponseDto<T>`

### 5.4. Search và Filter
- Tìm kiếm theo nhiều tiêu chí (course, instructor, semester, status)
- Search text trên nhiều trường (sectionCode, course name, instructor name)

### 5.5. Excel Import
- Import course sections và temporary records từ Excel
- Tự động tạo course, instructor nếu chưa tồn tại
- Xử lý lỗi và báo cáo kết quả

### 5.6. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Google OAuth integration
- Password hashing với bcrypt

### 5.7. Validation
- Kiểm tra trùng lịch học khi đăng ký
- Kiểm tra 1 sinh viên chỉ đăng ký 1 section của 1 môn học
- Kiểm tra thời gian đăng ký (CourseRegistrationPeriod)
- Kiểm tra lớp học phần chưa đầy

---

## 6. CẤU TRÚC DỰ ÁN

```
src/
├── module/
│   ├── auth/          # Authentication (login, register, JWT)
│   ├── user/          # User và Student management
│   ├── course/        # Course, CourseSection, Instructor, ClassSchedule
│   ├── registration/  # Registration và ExchangeRequest
│   ├── cohort/        # Cohort và CourseRegistrationPeriod
│   ├── semester/      # Semester management
│   └── temporary/     # Temporary records (available courses per cohort)
├── common/            # Shared utilities, interceptors, filters, DTOs
├── provider/          # Database providers (MySQL)
├── config/            # Configuration (TypeORM, etc.)
└── main.ts            # Application entry point
```

---

## 7. CÔNG NGHỆ SỬ DỤNG

- **Framework**: NestJS (Node.js)
- **ORM**: TypeORM
- **Database**: MySQL
- **Authentication**: JWT, Google OAuth2
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **File Processing**: XLSX (Excel)
- **Security**: Helmet, bcrypt
- **Logging**: Winston, Morgan

---

## 8. GHI CHÚ

- Chức năng Exchange Request matching chưa được implement đầy đủ
- Một số endpoint trong CourseRegistrationPeriodController đã bị comment
- Teacher role được định nghĩa nhưng chưa có chức năng cụ thể
- Google OAuth có thể hoạt động mà không cần GOOGLE_CLIENT_ID (verify token không check audience)

