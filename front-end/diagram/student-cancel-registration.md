a) Actor:  
- User (student).

b) Description:  
- This use case allows a student to cancel one of their registered class groups (course sections) directly on the drag‑and‑drop timetable by clicking the "Xóa" button in the timetable cell.

c) Pre-conditions:  
- The student is already logged into the system.  
- The drag‑and‑drop credit registration screen is open and has loaded the student's current timetable from the server.  

d) Main event flow (student cancels a registered class group):  
1. The student opens the drag‑and‑drop registration screen ("Đăng ký với thời khóa biểu").  
2. The system shows the timetable grid with the student's current registered class groups (each subject displayed as a block across its periods).  
3. The student identifies the subject/class group they want to cancel in the timetable.  
4. The student clicks the **"Xóa"** button in the head cell of that subject's block.  
5. The system cancels this registration.  
6. The system shows a success notification (for example, "Đã xóa [tên môn học] khỏi thời khóa biểu").  
7. The system updates the timetable so that the canceled class group is no longer shown.  
8. The use case ends.  

e) Branch flows / conditions:  

- **A1 – Local-only removal**  
  1. The student clicks "Xóa" on a timetable cell that does not have a server registration.  
  2. The system removes the subject block from the timetable grid only.  
  3. The system updates the list of registered subjects.  

- **A2 – System error when canceling registration**  
  1. The student clicks "Xóa" to cancel a registration.  
  2. The system fails to cancel the registration (for example, server error or rule violation).  
  3. The system shows an error notification such as "Không thể xóa lớp học phần".  
  4. The timetable remains unchanged; the student can try again later.  

f) Post-condition:  
- **Success**: the selected class group is removed from the student's timetable and its registration record is deleted from the database.  
- **Fallback/Failure**: in the fallback path (no `registrationId`) only the local timetable is changed; on a back-end error, no data is removed and the timetable stays the same.


=== activity diagram (student cancel registered class group)=====

```plantuml
@startuml

|User|
start
:Open drag-and-drop\nregistration screen;
:See timetable with registered\nclass groups;
:Click "Xóa" on the class group\nto be canceled;

if (Cell has registrationId?) then (Yes)
  |System|
  :Send cancel request to back-end;
  :Receive success response;
  |User|
  :See success notification\nand updated timetable;
  stop
else (No)
  |User|
  :See class group removed\nfrom local timetable only;
  stop
endif

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/student-cancel-registration/activity-diagram-1.png)

=== sequence diagram (student cancel registered class group)====

```plantuml
@startuml

title Student Cancel Registered Class Group (Drag-and-Drop Timetable)

actor Student
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

Student -> FE: 1. Click "Xóa" on a class group\nin the timetable
FE -> FE: 2. Check if timetable cell has\nregistrationId

alt registrationId exists
  FE -> BE: 3. Call API to delete registration\nfor this registrationId
  BE -> DB: 4. Verify student owns registration\nand delete record
  DB --> BE: 5. Confirm delete success
  BE --> FE: 6. Return success response
  FE -> Student: 7. Show success toast and\nre-sync timetable from server
else no registrationId (local-only)
  FE -> FE: 3. Remove class group from\nlocal timetable state
  FE -> Student: 4. Show updated timetable\n(without that class group)
end

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/student-cancel-registration/sequence-diagram-1.png)


