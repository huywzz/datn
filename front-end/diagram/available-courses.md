a) Actor:  
- User (student).

b) Description:  
- This use case allows the student to view the list of subjects/courses that are available for registration in the current credit registration period.

c) Pre-conditions:  
- The student is already logged into the system.  
- There is an active registration period configured in the system.  

d) Main event flow:  
1. The student selects the function to view available courses (opens the "Available courses" or credit registration screen).  
2. The system loads and displays the list of available subjects/courses for the current registration period.  
3. The student reviews the list of available courses (code, name, credits, etc.).  
4. The student scrolls, browses, and checks which courses are marked as available.  
5. The use case ends when the student has finished viewing the list (they may later proceed to register in another use case).  

e) Branch flow A1 – No courses available:  
1. The system cannot find any available courses for the current registration period.  
2. The system shows a message that there are no available courses to register at this time.  
3. The student acknowledges the message and may choose to leave the screen.  
4. The use case ends.  

f) Post-condition:  
- The student has seen the list (or the absence) of available courses for the current registration period and can decide what to do next (for example, register for courses in another use case or come back later).


=== activity diagram (view available courses)=====

```plantuml
@startuml

|User|
start
:Open "Available courses" screen;
:Wait for the list to load;

if (Courses available?) then (Yes)
  :View list of available courses\n(code, name, credits, etc.);
  :Scroll and review details of courses;
  :Decide next actions (e.g., register later);
  stop
else (No)
  :See message "No available courses to register";
  :Decide to leave the screen or come back later;
  stop
endif

@enduml
```

=== activity diagram image====

![diagram](/image-diagram/available-courses/activity-diagram-1.png)

=== sequence diagram (view available courses)====

```plantuml
@startuml

title View Available Courses in Current Registration Period

actor User
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

User -> FE: 1. Open "Available courses" screen
FE -> BE: 2. Request list of available courses\nfor current registration period
BE -> DB: 3. Query available courses\nfor this student & period
DB --> BE: 4. Return list of available courses\n(or empty list)

alt Courses available
  BE --> FE: 5. Return list of available courses
  FE -> User: 6. Display list of available courses\n(code, name, credits, etc.)
  User -> User: 7. Review and scroll through courses
else No courses available
  BE --> FE: 5. Return empty list / no courses
  FE -> User: 6. Show message "No available courses to register"
  User -> User: 7. Decide to leave screen or come back later
end

@enduml
```

=== sequence diagram image====

![diagram](/image-diagram/available-courses/sequence-diagram-1.png)


