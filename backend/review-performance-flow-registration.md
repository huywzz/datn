## Đánh giá hiệu suất các API trong flow đăng ký học phần

### 1. `GET /registrations/my-schedule`

- **Truy vấn chính**:
  - 1 query lấy `Student` theo `userId`.
  - 1 query `registrationRepository.find` với điều kiện theo quan hệ:
    - `student.userId = user.userId`
    - `section.semesterId = currentSemester`
    - `status = 'active'`
    - load relations `section.classSchedules`, `section.course`.
- **Đánh giá**:
  - Truy vấn dựa trên quan hệ và lọc `status`, `semesterId` là hợp lý, số lượng bản ghi mỗi sinh viên thường không quá lớn → hiệu suất ổn ở mức đơn lẻ.
  - Phần flatten lịch học được xử lý **trong memory** sau khi DB trả dữ liệu, không tạo thêm query.
- **Rủi ro / điểm cần chú ý**:
  - Nếu không có index trên các cột:
    - `registrations.student_id`
    - `registrations.status`
    - `course_sections.semester_id`
  - thì khi số lượng đăng ký lớn (nhiều năm dữ liệu) truy vấn có thể bị **full scan / join tốn kém**.
- **Khuyến nghị**:
  - Đảm bảo các index:
    - `registrations (student_id, status)`
    - `course_sections (semester_id)`
  - Có thể thêm `LIMIT` an toàn (vd: bảo vệ chống edge-case nếu dữ liệu bất thường).

---

### 2. `GET /temporaries/available-courses`

- **Truy vấn chính**:
  - 1 query lấy `User` + relation `student` theo `userId`.
  - 1 query `temporaryRepository.find`:
    - `cohortId = student.cohortId`
    - `status = 'active'`
    - load relation `course`.
- **Đánh giá**:
  - Mỗi cohort thường có số môn vừa phải → result set nhỏ, ổn cho UI dropdown/list.
  - Query đơn giản, điều kiện bằng (`=`), dễ tối ưu bằng index.
- **Rủi ro / điểm cần chú ý**:
  - Nếu `temporaries` phình to (rất nhiều khóa & môn), thiếu index trên:
    - `temporaries.cohort_id`
    - `temporaries.status`
  - thì filter theo cohort có thể tốn chi phí scan.
- **Khuyến nghị**:
  - Index:
    - `temporaries (cohort_id, status)`
  - Nếu sau này thêm filter khác (vd theo semester), cần thiết kế index composite phù hợp.

---

### 3. `GET /course-sections/course/:courseId`

- **Truy vấn chính** (QueryBuilder):
  - `FROM course_sections section`
  - `LEFT JOIN course`, `instructor`, `class_schedules`.
  - `WHERE section.courseId = :courseId`
  - Nếu user là **student**: thêm `section.status IN ('open','full')`.
  - Optional:
    - `semesterId` filter: `section.semesterId = :semesterId`
    - `search`: `section.sectionCode LIKE ... OR course.name LIKE ... OR instructor.fullName LIKE ...`
  - 2 lượt query:
    - `getCount()` (đếm tổng)
    - `getMany()` (dữ liệu trang hiện tại) với `skip/take`.
- **Đánh giá**:
  - Việc dùng `skip` + `take` + `getCount` là cách chuẩn để phân trang.
  - Filter theo `courseId`, `semesterId`, `status` giúp query tập trung trên một subset tương đối nhỏ (một môn học, một kỳ).
  - Join `classSchedules` theo `LEFT JOIN` giúp trả về đầy đủ lịch học trong một lần query (tốt cho UX, tránh N+1).
- **Rủi ro / điểm cần chú ý**:
  - `getCount()` + `getMany()` trên cùng 1 QueryBuilder → luôn **2 query**; với dataset rất lớn, `COUNT(*)` có thể tốn thời gian.
  - Join nhiều bảng (`course`, `instructor`, `class_schedules`) làm **row duplication** tăng (mỗi section x nhiều schedule) → `getCount()` thực tế vẫn đếm theo section nhưng DB phải xử lý join.
  - Nếu `search` dùng `LIKE %keyword%` sẽ không tận dụng được index bình thường → full scan theo field text.
- **Khuyến nghị**:
  - Đảm bảo index:
    - `course_sections (course_id, semester_id, status)`
    - `class_schedules (section_id)` (thường đã có FK index).
  - Nếu sau này số lượng section/schedule rất lớn:
    - Có thể tách **đếm** và **load data** đơn giản hơn (vd: đếm chỉ trên `course_sections` không join).
    - Xem xét hạn chế `LIKE %keyword%` hoặc dùng full-text index nếu DB ủng hộ.

---

### 4. `POST /registrations` (Đăng ký học phần)

- **Chuỗi truy vấn / thao tác**:
  1. Tìm `Student` theo `userId` hoặc `studentId` (admin).
  2. Tìm 1 bản ghi `course_registration_period` có `status = true`.
  3. Tìm `CourseSection` theo `sectionId` + load `classSchedules`, `semester`.
  4. Tìm tất cả `registrations` của sinh viên trong `currentSemester`:
     - filter theo quan hệ: `student.id`, `section.semesterId`.
     - load `section.classSchedules`.
  5. Logic check trùng môn + trùng lịch làm **trong memory** (loop).
  6. Transaction:
     - `SELECT ... FOR UPDATE` (`pessimistic_write`) trên `CourseSection` theo `sectionId`.
     - `INSERT` `Registration`.
     - `UPDATE` `CourseSection.currentStudents = currentStudents + 1`.
     - `SELECT` lại `Registration` với relations `student`, `section`.
- **Đánh giá**:
  - Sử dụng transaction + `pessimistic_write` là **điểm cộng lớn về mặt đồng thời**: tránh overbooking khi nhiều request cùng đăng ký 1 section.
  - Logic kiểm tra trùng môn & trùng lịch được gom trong một batch query `registrationRepository.find(...)` → tránh N+1.
  - Các truy vấn đều lọc tốt theo `student`, `semester`, `sectionId`, phù hợp để đánh index.
- **Rủi ro / điểm cần chú ý**:
  - Bước 4 (`registrationRepository.find` với relations `section.classSchedules`) có thể trả về khá nhiều data (tất cả đăng ký trong kỳ của sinh viên) → tạm chấp nhận vì per-student thường không quá lớn; nhưng nếu sinh viên đăng ký rất nhiều kỳ / tái sử dụng table chung không tách theo năm thì query có thể tăng dần.
  - Transaction với `pessimistic_write`:
    - Nếu nhiều user cùng đăng ký vào **cùng một section**, sẽ có **đợi lock** (blocking) – chấp nhận được vì đây chính là mục đích.
    - Nếu code ở trong transaction dài hơn (thêm nhiều logic khác) sẽ kéo dài thời gian giữ lock.
- **Khuyến nghị**:
  - Đảm bảo index:
    - `registrations (student_id, semester, status)`
    - `registrations (section_id)` để hỗ trợ join ngược.
    - `course_sections (section_id)` (thường là PK, đã index).
  - Cân nhắc:
    - Nếu số lượng đăng ký trên 1 sinh viên/1 kỳ tăng cao, có thể **tối giản các field/relations** load trong query kiểm tra (chỉ load `courseId` + các `classSchedules` tối thiểu cần thiết).
  - Theo dõi thời gian thực thi transaction ở môi trường thật; nếu lock contention cao, có thể tính đến:
    - Giới hạn retry / timeout.
    - Tách 1 số check (vd đã đăng ký môn) ra ngoài transaction nếu không phụ thuộc vào `currentStudents`.

---

### Tổng kết chung về hiệu suất

- Flow sử dụng **ít query, có điều kiện lọc rõ ràng**, và hầu hết các check nặng được xử lý trong memory sau khi đã giới hạn dữ liệu từ DB → phù hợp cho quy mô vừa.
- Điểm then chốt về hiệu suất và scale nằm ở:
  - Hệ thống **index** trên các cột khoá: `student_id`, `section_id`, `semester_id`, `cohort_id`, `status`.
  - Sự phát triển kích thước bảng `registrations`, `course_sections`, `class_schedules`, `temporaries` theo thời gian.
- Khi hệ thống tăng số lượng người dùng và năm dữ liệu, cần:
  - Rà soát index theo các query ở trên.
  - Monitor: slow query log của MySQL và thêm/tinh chỉnh index tương ứng.
