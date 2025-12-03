a) Actor:  
- User (admin).

b) Description:  
- This use case allows an admin to open the detail page of a course and see its basic information together with the list of its class groups (course sections).

c) Pre-conditions:  
- The admin is already logged into the system.  
- The admin has access to the courses list and selects a specific course to view details.  

d) Main event flow:  
1. The admin selects a course (for example, clicks on a course in the "Danh sách môn học" page).  
2. The system navigates to the course detail page.  
3. The system displays:  
   - The course information (code, name, credits).  
   - The table of class groups including section code, schedule, capacity, number of registered students, and status.  
4. The admin reviews the course details and its class groups.  
5. The admin may click on a class group row to navigate to the list of students for that class group.  
6. The use case ends when the admin finishes reviewing the information.  

e) Branch flow A1 – No class groups for this course:  
1. The system finds no class groups for the selected course.  
2. The system shows the message "Chưa có lớp học phần nào" in the table.  
3. The admin understands that no sections exist yet for this course.  
4. The use case ends.  

f) Post-condition:  
- The admin has seen the course's basic information and the list (or absence) of its class groups and can decide further actions, such as managing students in a specific section.


=== activity diagram (view course detail and its sections)=====

```plantuml
@startuml

|User|
start
:Select a course from\n"Danh sách môn học";
:Open course detail page;
:View course information\n(code, name, credits);
:View list of class groups\n(section code, schedule, capacity, status);
:Optionally click a class group\nto manage its students;
stop

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/course-detail/activity-diagram-1.png)

=== sequence diagram (view course detail and its sections)====

```plantuml
@startuml

title View Course Detail and Its Class Groups

actor Admin
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

Admin -> FE: 1. Select a course\n(open course detail page)
FE -> BE: 2. Call API to get course details
BE -> DB: 3. Query course by id
DB --> BE: 4. Return course data
BE --> FE: 5. Send course details

FE -> BE: 6. Call API to get semesters\n(for filtering sections)
BE -> DB: 7. Query semesters
DB --> BE: 8. Return semesters
BE --> FE: 9. Send semesters list

FE -> BE: 10. Call API to get class groups\n(sections) for this course
BE -> DB: 11. Query sections by course id
DB --> BE: 12. Return sections list
BE --> FE: 13. Send sections list

FE -> Admin: 14. Display course information\nand table of class groups

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/course-detail/sequence-diagram-1.png)


