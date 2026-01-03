a) Actor:  
User (student).
b) Description:  
This use case allows the student to view their weekly timetable showing all registered course sections with meeting times and locations.
c) Pre-conditions:  
The student is already logged into the system.
d) Main event flow:  
1. The student clicks on "Thời khóa biểu" in the sidebar.  
2. The system requests the student's timetable data from the server.  
3. The system displays the weekly timetable.  
4. The student views the timetable.  
5. The use case ends.
e) Branch flows / conditions:  
	A1 – Load failed
1.	The system fails to load the timetable data.  
2.	The system shows an error message: "Không thể tải thời khóa biểu".  
3.	The student can retry or leave the page.
f) Post-condition:  
	Success: The student has viewed their weekly timetable with registered course sections.  
	Failure: The student sees an error message and the timetable is not displayed.

=== activity diagram (view timetable)=====

@startuml

|User|
start
:Click "Thời khóa biểu" in sidebar\nto access timetable page;
:Wait for timetable to load;

if (Timetable loaded successfully?) then (Yes)
  if (Has registered sections?) then (Yes)
    :View weekly timetable grid\nwith all registered course sections\nplaced in time slots;
    :See course information\n(name, section code, location);
    :Navigate and review schedule;
    stop
  else (No)
    :See empty timetable grid\nwith message "Chưa có lịch học";
    stop
  endif
else (No)
  :See error message\n"Không thể tải thời khóa biểu";
  :Decide to retry or leave;
  stop
endif

@enduml=== activity diagram image====

![diagram](../image-diagram/view-timetable/activity-diagram-1.png)

=== sequence diagram (view timetable)=====
tuml
@startuml

title View Timetable

actor Student
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

Student -> FE: 1. Click "Thời khóa biểu"\nin sidebar to access timetable page
FE -> BE: 2. Request student's timetable data\n(all registered course sections)
BE -> DB: 3. Query student's registrations\nwith course section details\n(meetings, times, locations)
DB --> BE: 4. Return timetable data\n(registrations with section info)
BE --> FE: 5. Send timetable data\n(organized by day and period)

alt Timetable data available
  FE -> FE: 6. Organize sections by day and period
  FE -> Student: 7. Render weekly timetable grid\nwith course sections in time slots
  Student -> Student: 8. View and review timetable
else No registrations
  BE --> FE: 5. Return empty list
  FE -> Student: 6. Display empty timetable grid\nwith message "Chưa có lịch học"
else System error
  BE --> FE: 5. Return error response
  FE -> Student: 6. Show error message\n"Không thể tải thời khóa biểu"
end

@enduml=== sequence diagram image====