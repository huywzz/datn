a) Actor:
User (student).
b) Description:
This use case allows the student to create exchange requests to swap registered course sections. A student can add items (sections to add) and remove items (sections to remove) in a transaction, view their exchange requests, and delete them.
c) Pre-conditions:
	The student is already logged into the system.
	The student has at least one registered course section.
d) Main event flow (create exchange request):
1.	The student accesses the "Hiệu chỉnh đăng ký" page.
2.	The student clicks "Tạo yêu cầu" to create a new exchange request.
3.	The student selects sections to remove (REMOVE action) and sections to add (ADD action).
4.	The system validates:
	Sections to remove must be currently registered by the student.
	Sections to add must have available slots and no time conflicts.
	No duplicate sections in the same transaction.
5.	If validation passes, the system creates an exchange transaction with items and adds it to the processing queue.
6.	The system shows a success notification.
7.	The new transaction appears in the list.
8.	The use case ends.
e) Branch flows / conditions:
	A1 – View exchange requests
1.	The student views the list of their exchange.
2.	Each transaction shows status (pending, matched, completed, etc.) and items (sections to add/remove).
	A2 – Delete exchange request
1.	The student clicks "Xóa" on an exchange transaction.
2.	The system deletes the exchange request and its items exchange.
3.	The system shows a success notification.
	A3 – Validation failed
1.	Validation fails (section not registered, time conflict, etc.).
2.	The system shows an error message.
3.	The transaction is not created.
	A4 – System error
1.	System fails to create or delete the exchange request.
2.	The system shows an error message.
f) Post-condition:
•	Success: A new exchange transaction is created and added to the queue, or an existing transaction is deleted.
Failure: No changes are made to the database


@startuml

|User|
start
:Access "Hiệu chỉnh đăng ký" page;
:View list of exchange transactions;

if (Action?) then (Create)
  :Configure exchange sections
  (select REMOVE & ADD);
  :Click "Tạo yêu cầu";
  
  if (Validation passed?) then (Yes)
    |System|
    :Create transaction with items;
    :Add to processing queue;
    |User|
    :See success notification;
    stop
  else (No)
    |User|
    :See error message;
    stop
  endif

elseif (Delete) then
  :Click "Xóa" on transaction;
  |System|
  :Delete transaction;
  |User|
  :See success notification;
  stop
endif

@enduml


==== sequence diagram ===
@startuml

title Exchange Request - Create, View, and Delete

actor Student
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

== Load page ==
Student -> FE: 1. Access "Hiệu chỉnh đăng ký" page
FE -> BE: 2. Request registered sections\nand exchange requests
BE -> DB: 3. Query student's registrations\nand exchange requests
DB --> BE: 4. Return registrations and requests
BE --> FE: 5. Send registrations and requests
FE -> Student: 6. Display registered sections\nand exchange requests list

== Create exchange request ==
Student -> FE: 7. Select current section and\ntarget section, click "Tạo yêu cầu"
FE -> FE: 8. Validate (target full, not registered,\nno time conflict)
alt Validation passed
  FE -> BE: 9. Create exchange request\n(current section, target section)
  BE -> DB: 10. Insert exchange request record
  DB --> BE: 11. Confirm saved
  BE --> FE: 12. Return success with request data
  FE -> Student: 13. Show success notification\nand update requests list
else Validation failed
  FE -> Student: 9. Show error message\n(target not full, already registered,\nor time conflict)
end

== Delete exchange request ==
Student -> FE: 14. Click "Xóa" on an exchange request
FE -> BE: 15. Delete exchange request by ID
BE -> DB: 16. Verify ownership and delete request
alt Delete successful
  DB --> BE: 17. Confirm deleted
  BE --> FE: 18. Return success
  FE -> Student: 19. Show success notification\nand remove from list
else Delete failed
  BE --> FE: 18. Return error
  FE -> Student: 19. Show error message
end

@enduml