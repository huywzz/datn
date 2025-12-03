a) Actor:  
- User (student).

b) Description:  
- This use case allows the student to access the "Thời khóa biểu" page and see their weekly schedule that the system returns from the database.

c) Pre-conditions:  
- The student is already logged into the system.  

d) Main event flow:  
1. The student clicks on the "Thời khóa biểu" item in the sidebar to access the timetable page.  
2. The front-end opens the "Thời khóa biểu" page and sends a request to the back-end to get the student's schedule.  
3. The back-end reads the timetable data for this student from the database.  
4. The back-end returns the timetable data to the front-end.  
5. The front-end displays the weekly timetable table (days × periods) with the student's registered classes.  
6. The student views the timetable and remembers/uses it as needed.  
7. The use case ends.  

e) Branch flow A1 – No special branches:  
- In this simplified flow we assume the request succeeds and data is returned normally.  

f) Post-condition:  
- The student has seen the temporary timetable that reflects their current registered classes.


=== activity diagram (view temporary timetable)=====

```plantuml
@startuml

|User|
start
:Click "Thời khóa biểu" in sidebar\nto access timetable page;
:Wait for timetable to appear;
:View weekly timetable table\n(days × periods with classes);
:Use timetable information as needed;
stop

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/temp-timetable/activity-diagram-1.png)

=== sequence diagram (view temporary timetable)====

```plantuml
@startuml

title View Temporary Timetable

actor User
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

User -> FE: 1. Click "Thời khóa biểu"\nin sidebar to access timetable page
FE -> BE: 2. Request student timetable
BE -> DB: 3. Read timetable data\nfor this student
DB --> BE: 4. Return timetable data
BE --> FE: 5. Send timetable data back
FE -> User: 6. Render weekly timetable table\nwith the student's classes
User -> User: 7. View timetable

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/temp-timetable/sequence-diagram-1.png)


