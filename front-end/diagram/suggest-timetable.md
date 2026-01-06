a) Actor:  
- User (student).

b) Description:  
- This use case allows the student to get AI-powered timetable suggestions based on their preferences. The system uses Gemini API to score course sections and beam search algorithm to select optimal sections without schedule conflicts.

c) Pre-conditions:  
- The student is already logged into the system.  
- There are available course sections in the current semester.

d) Main event flow:  
1. The student accesses the "Đề xuất thời khóa biểu" page.  
2. The student enters their preferences (e.g., "Tôi muốn học vào buổi sáng, không học thứ 7").  
3. The student clicks the "Gợi ý" button.  
4. The system sends course sections and preferences to the suggest-timetable service.  
5. The suggest-timetable service calls Gemini API to score all course sections based on preferences.  
6. The suggest-timetable service uses beam search algorithm to select optimal sections (no conflicts, maximize score).  
7. The system displays the suggested timetable with selected course sections.  
8. The use case ends.  

e) Branch flows / conditions:  

- **A1 – No suggestions returned**  
  1. The suggest-timetable service cannot generate suggestions (e.g., API error, no valid sections).  
  2. The system shows an error message like "Không thể tạo đề xuất thời khóa biểu".  
  3. No timetable is displayed.  

- **A2 – Suggest service unavailable**  
  1. The suggest-timetable service is not configured or unavailable.  
  2. The system shows an error message like "Suggest service URL not configured".  
  3. No timetable is displayed.  

f) Post-condition:  
- **Successful path**:  
  - The student has received AI-powered timetable suggestions displayed in a weekly schedule format.  
  - The suggested sections have no schedule conflicts and maximize preference satisfaction.  
- **Error/branch paths**:  
  - If any error occurs (A1–A2), the system shows an appropriate error message and no timetable is displayed.


=== activity diagram (suggest timetable)=====

```plantuml
@startuml

|User|
start
:Access "Đề xuất thời khóa biểu" page;
:Enter preferences\n(e.g., "học buổi sáng, không học thứ 7");
:Click "Gợi ý" button;
:Wait for suggestions;

|System|
:Get all course sections;
:Send course sections and preferences\nto suggest-timetable service;

|Suggest-timetable Service|
:Flatten course sections data;
:Call Gemini API to score sections\nbased on preferences;
:Use beam search algorithm\nto select optimal sections\n(no conflicts, maximize score);
:Return suggested section IDs;

|System|
:Filter suggested sections\nfrom course sections;
:Display suggested timetable;
|User|
:View suggested timetable;
stop

@enduml
```

=== activity diagram image====

![diagram](../image-diagram/suggest-timetable/activity-diagram-1.png)

=== sequence diagram (suggest timetable)====

```plantuml
@startuml

title Suggest Timetable

actor User
participant "Front-end" as FE
participant "Back-end" as BE
participant "Suggest-timetable Service" as PY
participant "Gemini API" as AI
database "Database" as DB

== Request suggestions ==
User -> FE: 1. Enter preferences\nand click "Gợi ý"
FE -> BE: 2. POST /registrations/suggest-timetable\n{ preferences }

== Get course sections ==
BE -> DB: 3. Query all course sections\nfor current semester
DB --> BE: 4. Return course sections
BE -> BE: 5. Get student info\n(current semester)

== Call suggest-timetable service ==
BE -> PY: 6. POST /suggest-timetable\n{ courseSections, studentPreferences }
PY -> PY: 7. Flatten course sections data
PY -> AI: 8. Call Gemini API\nwith flattened data and preferences
AI --> PY: 9. Return scored sections\n{ sectionId: score }

PY -> PY: 10. Use beam search algorithm\nto select optimal sections\n(no conflicts, maximize score)
PY --> BE: 11. Return { success, sectionIds }

== Return results ==
alt Success and sectionIds returned
  BE -> BE: 12. Filter suggested sections\nfrom allCourseSections by sectionIds
  BE --> FE: 13. Return suggested sections
  FE -> User: 14. Display suggested timetable
else No suggestions or error
  BE --> FE: 12. Return error
  FE -> User: 13. Show error message
end

@enduml
```

=== sequence diagram image====

![diagram](../image-diagram/suggest-timetable/sequence-diagram-1.png)


