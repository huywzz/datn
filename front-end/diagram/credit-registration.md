 a) Actor:  
- User (student).

b) Description:  
- This use case allows the student to register for a class group by **dragging a class group (course section) onto the timetable grid** on the "Đăng ký tín chỉ" page (tab "Đăng ký với thời khóa biểu").

c) Pre-conditions:  
- The student is already logged into the system.  
- There is an active credit registration period that allows the student to register.  
- The system has loaded:  
  - The list of available subjects that the student can register.  
  - The student's current timetable (existing registrations) from the server.  

d) Main event flow (register by drag-and-drop):  
1. The student accesses the "Đăng ký tín chỉ" page and switches to the "Đăng ký với thời khóa biểu" tab.  
2. The system displays:  
   - On the left: the list of available subjects, each subject with a button "Xem nhóm học phần".  
   - On the right: the weekly timetable grid (days × periods) with the student's current classes.  
3. The student clicks "Xem nhóm học phần" for a subject.  
4. The system displays the list of class groups (sections) for that subject under the subject card.  
5. The student chooses one class group and starts dragging it towards the timetable grid.  
6. The student drops the class group onto the timetable (any empty cell, used only as a trigger).  
7. The system checks all conditions for that class group:  
   - The class group has valid meeting information (day of week, start period, end period).  
   - All meetings fall within allowed periods (1–10).  
   - There is **no time conflict** with any existing class in the timetable.  
   - The class group is **not already placed** in the timetable.  
8. If all conditions are satisfied, the system places the class group into the timetable at the correct positions (according to its meetings) and adds the subject to the list of registered subjects.  
9. The student sees the class group in the timetable and continues registering other subjects if desired.  
10. The use case ends.  

e) Branch flows / conditions:  

- **A1 – No meetings (no schedule) for the class group**  
  1. The student drags a class group that has no meeting information.  
  2. The system shows an error message like "Lớp học phần này không có lịch học".  
  3. The class group is not placed on the timetable.  

- **A2 – Class group already in timetable**  
  1. The student drags a class group that is already placed in the timetable (same section).  
  2. The system shows an information message such as "Lớp học phần này đã được thêm vào thời khóa biểu".  
  3. The timetable is not changed.  

- **A3 – Meeting out of timetable bounds**  
  1. A meeting of the class group has a period range outside the allowed range (for example, less than 1 or greater than 10).  
  2. The system shows an error message like "Lịch học vượt quá giới hạn: [day] tiết [start-end]".  
  3. The class group is not placed on the timetable.  

- **A4 – Time conflict with existing classes**  
  1. One or more meetings of the dragged class group overlap with existing classes in the timetable.  
  2. The system lists the conflict slots (for example: "Xung đột lịch học tại: T2 tiết 3, T4 tiết 5").  
  3. The system shows an error message with those conflict slots.  
  4. The class group is not placed on the timetable.  

- **A5 – Registration error**  
  1. All checks pass and the class group is placed into the timetable.  
  2. The system fails to register the class group (for example, server error or business rule violation).  
  3. The system reverts the timetable to its previous state and removes the subject from the registered subjects list.  
  4. The system shows an error message such as "Đăng ký lớp học phần thất bại".  

f) Post-condition:  
- **Successful path**:  
  - The student has successfully registered one or more class groups by drag-and-drop.  
  - The timetable reflects the new classes and the registrations are stored in the database.  
- **Error/branch paths**:  
  - If any of the above conditions fail (A1–A5), the system prevents invalid registration and keeps the timetable consistent.


=== activity diagram (credit registration by drag-and-drop)=====

```plantuml
@startuml

|User|
start
:Access "Đăng ký tín chỉ" page\n(tab "Đăng ký với thời khóa biểu");
:View available subjects and timetable grid;
:Click "Xem nhóm học phần" for a subject;
:See list of class groups for that subject;
:Drag a class group towards timetable;
:Drop class group onto timetable;

if (Class group has valid meetings\nand within allowed periods\nand no conflicts\nand not already in timetable?) then (Yes)
  :See class group appear\nin timetable cells;
  :See subject considered as registered;
  :Decide to continue registering\nor stop;
  stop
else (No)
  :See error / info message\n(no meetings, out of bounds,\nconflict, or already added);
  :Timetable stays unchanged;
  :Decide to try another class group\nor another subject;
  stop
endif

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/credit-registration/activity-diagram-1.png)

=== sequence diagram (credit registration by drag-and-drop)====

```plantuml
@startuml

title Credit Registration via Drag-and-Drop Timetable

actor User
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

== Load page ==
User -> FE: 1. Access "Đăng ký tín chỉ"\n(tab "Đăng ký với thời khóa biểu")
FE -> BE: 2. Request available subjects\nand current timetable
BE -> DB: 3. Query available subjects\nand existing registrations
DB --> BE: 4. Return subjects and timetable data
BE --> FE: 5. Send subjects and timetable
FE -> User: 6. Show subjects list and\ntimetable grid

== Load class groups for a subject ==
User -> FE: 7. Click "Xem nhóm học phần"\nfor a subject
FE -> BE: 8. Request class groups\nfor that subject
BE -> DB: 9. Query class groups by course id
DB --> BE: 10. Return class groups
BE --> FE: 11. Send class groups
FE -> User: 12. Display class groups\nunder the subject

== Drag-and-drop registration ==
User -> FE: 13. Drag a class group\nand drop it onto timetable
FE -> FE: 14. Validate class group\n(meetings exist, within periods,\nno conflict, not already in timetable)

alt All checks passed
  FE -> FE: 15. Place class group\ninto timetable grid (optimistic)
  FE -> BE: 16. Send registration request\nfor this class group
  BE -> DB: 17. Create registration record
  DB --> BE: 18. Confirm saved
  BE --> FE: 19. Return success
  FE -> User: 20. Keep timetable update\nand show success state
else Validation failed (no meetings /\nout-of-bounds / conflict /\nalready in timetable)
  FE -> User: 15. Show error / info message\nand keep timetable unchanged
end

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/credit-registration/sequence-diagram-1.png)


