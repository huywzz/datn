a) Actor:  
- User (student, admin).

b) Description:  
- This use case allows the user to log into the system with email and password in order to use the application's functions.

c) Pre-conditions:  
- The user has not yet logged into the system.  

d) Main event flow:  
1. The user selects the login function.  
2. The system displays the login form (email, password, login button).  
3. The user enters email and password into the login form.  
4. The system checks the email and password information.  
5. If the information is valid, the system confirms the user has logged in successfully.  
6. The user can use the application's functions according to their role.  
7. The use case ends.  

e) Branch flow A1:  
- The user logs in unsuccessfully.  
1. The system notifies that the login process was unsuccessful.  
2. The system allows the user to choose: register (if they do not have an account) or re-enter email/password to log in again.  
3. If the user chooses to log in again, return to step 2 of the main event flow.  
4. If the user does not continue logging in, the use case ends.  

f) Post-condition:  
- The user has logged in successfully and can use the functions that the application provides.


=== activity diagram=====

```plantuml
@startuml

|User|
start
:Enter information to login;

if (Information valid?) then (Yes)
  :Receive notifications\n(login success);
  :Go to system / use functions;
  stop
else (No)
  :Receive error messages;
  if (Re-login?) then (Yes)
    :Enter information to login;
  else (Skip)
    :Receive notifications\n(login failed);
    stop
  endif
endif

@enduml
```

=== activity diagram image====

![diagram](/image-diagram/login/activity-diagram-1.png)

---

=== sequence diagram====

```plantuml
@startuml

title Login with Email & Password Flow

actor User
participant "Front-end" as FE
participant "Back-end" as BE
database "Database" as DB

User -> FE: 1. Access login screen
FE -> User: 2. Display login form

User -> FE: 3. Enter email & password\n4. Click "Login"
FE -> FE: 5. Check email & password information

alt Information invalid
  FE -> User: 6. Show error messages under the corresponding fields
else Information valid
  FE -> BE: 7. Send login request
  BE -> DB: 8. Check login information
  DB --> BE: 9. Return check result

  alt Login successful
    BE --> FE: 10. Confirm login success
    FE -> User: 11. Show login success notification\nand navigate to application screen
  else Login failed
    BE --> FE: 12. Notify login failure
    FE -> User: 13. Show error notification\nand allow re-login or choose another function
  end
end

@enduml
```
---

=== sequence diagram image====

![diagram](/image-diagram/login/sequence-diagram-1.png)


