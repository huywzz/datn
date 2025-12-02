a) Actor:  
- User (admin).

b) Description:  
- This use case allows an admin to import class groups (course sections) for a semester and cohort by uploading an Excel file on the "Danh sách môn học" → "Import Excel" dialog. The back-end will validate each row and report any errors per row.

c) Pre-conditions:  
- The admin is already logged into the system.  
- The admin has permission to access the course management/import page.  

d) Main event flow (import course sections):  
1. The admin opens the "Danh sách môn học" page.  
2. The admin clicks the **"Import Excel"** button to open the import dialog.  
3. The system displays an import form with fields: **Học kỳ**, **Khóa**, and **File Excel**.  
4. The admin selects a semester from the "Học kỳ" dropdown.  
5. The admin selects a cohort from the "Khóa" dropdown.  
6. The admin chooses an Excel file (`.xlsx` or `.xls`) from their computer in the "File Excel" input.  
7. The admin clicks the **"Import"** button to submit the form.  
8. The front-end validates the form:  
   - A file has been selected.  
   - A valid semester id is selected.  
   - A cohort id is selected.  
9. If validation passes, the front-end calls the back-end API to import course sections with the selected file, semester and cohort.  
10. The back-end reads and processes the Excel file **row by row**, performing validations such as:  
    - Check that each row has all required columns.  
    - Check whether the referenced course already exists; if not, mark that row as error.  
    - Check whether the section code is duplicated.  
    - Check that, for a section with multiple schedule rows, the schedules do not overlap with each other.  
    - For any row that fails validation, add an error entry into an error array; for valid rows, create/update course sections in the database.  
11. The back-end returns an import result including information about successful rows and an array of rows with errors and their messages.  
12. The front-end shows a custom toast dialog containing the import result JSON (success, per-row errors, details).  
12. The form is reset, the dialog is closed, and the course list is refreshed.  
13. The use case ends.  

e) Branch flows / validation conditions:  

- **A1 – Missing or invalid form fields**  
  1. The admin submits the form without choosing a file, semester, or cohort.  
  2. The validation fails and shows error messages such as "Vui lòng chọn file", "Vui lòng chọn học kỳ", "Vui lòng chọn khóa".  
  3. No API call is made until all required fields are valid.  

- **A2 – Per-row validation errors in Excel**  
  1. The admin submits a valid form and the back-end starts processing rows.  
  2. For some rows, the back-end detects problems such as: missing required columns, course not existing, duplicated section code, or overlapping schedules within the same section.  
  3. The back-end collects these row errors (with row index and error message) into an error array and returns it in the import result.  
  4. The front-end displays this error array in the JSON result so the admin can see which rows failed and why.  
  5. Valid rows may still be imported successfully depending on back-end logic.  

- **A3 – Back-end error during import (global failure)**  
  1. The admin submits a valid form, but the back-end fails to process the Excel file entirely (e.g. wrong format, server error).  
  2. The back-end returns an error message instead of a structured import result.  
  3. The front-end shows an error toast with that message.  
  4. The dialog remains open with the current selections so the admin can fix and retry.  

f) Post-condition:  
- **Success**: course sections from all valid rows of the Excel file are imported into the system for the chosen semester and cohort; the import result also tells the admin which rows (if any) failed validation.  
- **Failure/validation**: if front-end validation fails or the back-end reports a global error, no rows are imported; if only some rows fail per-row validation, only the valid rows are imported while the admin is informed about the invalid rows.


=== activity diagram (admin import course sections)=====

```plantuml
@startuml

|User|
start
:Access "Danh sách môn học" page;
:Click "Import Excel" button;
:See import dialog (Học kỳ,\nKhóa, File Excel);
:Select semester;
:Select cohort;
:Choose Excel file;
:Click "Import";

if (All fields valid on FE?) then (Yes)
  |System (Back-end)|
  :Receive file, semesterId,\ncohortId from FE;
  :For each row in Excel:\n- Check required columns\n- Check course exists\n- Check section code not duplicated\n- Check schedules do not overlap;
  :Collect row errors into\nan error list;
  :Create/update sections for\nall valid rows;
  :Return import result with\nsuccess data and row errors;
  |User|
  :See import result JSON\n(including any row errors);
  :Dialog closes and course list refreshes;
  stop
else (No)
  :See validation error messages\nfor missing/invalid fields;
  :Adjust selections or choose file again;
  stop
endif

@enduml
```

=== sequence diagram (admin import course sections)====

```plantuml
@startuml

title Admin Import Course Sections from Excel

actor Admin
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

== Open import dialog ==
Admin -> FE: 1. Click "Import Excel" on\n"Danh sách môn học" page
FE -> Admin: 2. Show import dialog\n(Học kỳ, Khóa, File Excel)

== Submit import form ==
Admin -> FE: 3. Select semester, cohort\nand choose Excel file
Admin -> FE: 4. Click "Import"
FE -> FE: 5. Validate form fields\n(file, semesterId, cohortId)

alt Validation passed (FE)
  FE -> BE: 6. Call API to import\ncourse sections with file,\nsemesterId and cohortId
  BE -> BE: 7. For each row in Excel:\n- Check required columns\n- Check course exists\n- Check section code not duplicated\n- Check schedules do not overlap\n- Add row errors to error list;
  BE -> DB: 8. Create/update sections\nfor all valid rows
  DB --> BE: 9. Confirm DB operations
  BE --> FE: 10. Return import result\nwith success data and row errors
  FE -> Admin: 11. Show custom toast with\nimport result JSON and refresh course list
else Validation failed (FE)
  FE -> Admin: 6. Show validation error messages
end

@enduml
```


