a) Actor:  
- User (admin).

b) Description:  
- This use case allows an admin to open a class group (course section) and view the list of students registered in that section.

c) Pre-conditions:  
- The admin is already logged into the system.  
- The admin has access to the course and class group management screens.  
- A specific section (class group) has been selected from the course detail page or another admin screen.  

d) Main event flow (view students in a section):  
1. The admin selects a class group (for example, from the course detail page) to view its students.  
2. The system navigates to the "Danh sách sinh viên lớp học phần" page for the selected section.  
3. The system displays:  
   - The section information (course, section code, instructor, capacity, status, semester, timetable).  
   - The table of students with columns such as student code, full name, class, major, cohort year, semester and registration date.  
4. The admin reviews the list of students in the section.  
5. The use case ends when the admin finishes viewing the list (other actions like add/remove are handled in related flows).  

e) Branch flows / related actions:  

- **A1 – No students in section**  
  1. The system finds no students in the section.  
  2. The system shows the message "Chưa có sinh viên nào đăng ký lớp học phần này".  
  3. The admin may decide to add students (via another action on the same screen) or leave the page.  

- **A2 – Search/filter students in section**  
  1. The admin types a keyword (at least 2 characters) into the search input.  
  2. The system filters the list of students for the current section with that keyword.  
  3. If no matching students are found, the system shows "Không tìm thấy sinh viên phù hợp với từ khóa.".  

- **A3 – Remove a student from the section**  
  1. The admin clicks the delete button (trash icon) on a student row.  
  2. A confirmation dialog is shown asking the admin to confirm removing this student from the section.  
  3. If the admin confirms, the system removes the student registration from this section.  
  4. The system shows a success notification "Đã xóa sinh viên khỏi lớp học phần" and refreshes the student list.  

- **A4 – Add a student to the section**  
  1. The admin clicks the "Thêm sinh viên" button.  
  2. A dialog opens asking the admin to choose a cohort and search for students by keyword (minimum 2 characters).  
  3. The admin selects a cohort and types a search keyword; the system searches students in that cohort.  
  4. The system shows the search results in a table where the admin can select one student.  
  5. The admin confirms adding the selected student to the section.  
  6. The system registers the student into the section.  
  7. The system shows a success notification "Đã thêm sinh viên vào lớp học phần", closes the dialog and refreshes the student list.  

f) Post-condition:  
- The admin has seen the list of students in the section and, where applicable, may have removed or added students.  
- The database and the displayed list remain consistent after any add/remove actions.  


=== activity diagram (view students in a class group)=====

```plantuml
@startuml

|User|
start
:Select a class group to manage;
:Open "Danh sách sinh viên lớp học phần" page;
:View class group information;
:View table of students in the section;
stop

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/section-students/activity-diagram-1.png)

=== sequence diagram (view students in a class group)====

```plantuml
@startuml

title View Students in a Class Group

actor Admin
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

== Load section info and students ==
Admin -> FE: 1. Open "Danh sách sinh viên lớp học phần"\nfor a specific section
FE -> BE: 2. Call API to get section info\n(course, section code, instructor, etc.)
BE -> DB: 3. Query section by section id
DB --> BE: 4. Return section info
BE --> FE: 5. Send section info

FE -> BE: 6. Call API to get students\nin this section
BE -> DB: 7. Query registrations/students\nby section id
DB --> BE: 8. Return list of students
BE --> FE: 9. Send students list
FE -> Admin: 10. Display section info\nand table of students

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/section-students/sequence-diagram-1.png)


