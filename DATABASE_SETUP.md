# Pathshala ERP: Database Setup (Windows)

Follow these commands in your Windows Command Prompt or PowerShell to set up the MySQL database.

## 1. Login to MySQL
Open your terminal and run:

```powershell
mysql -u root -p
```
*(Enter your root password when prompted)*

## 2. Create Database
Run the following SQL commands in the MySQL prompt:

```sql
CREATE DATABASE pathshala_db;
USE pathshala_db;

-- Create application user and grant permissions
CREATE USER 'pathshala_user'@'localhost' IDENTIFIED BY 'Pathshala@123';
GRANT ALL PRIVILEGES ON pathshala_db.* TO 'pathshala_user'@'localhost';
CREATE USER 'pathshala_user'@'127.0.0.1' IDENTIFIED BY 'Pathshala@123';
GRANT ALL PRIVILEGES ON pathshala_db.* TO 'pathshala_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

## 3. Apply Schema
Exit the MySQL prompt (`exit;`) and run this from the `Pathshala/database` directory:

```powershell
mysql -u root -p pathshala_db < schema.sql
mysql -u root -p pathshala_db < schema_extended.sql
```

## 4. Seed Data
To populate the database with initial records (100 students, 25 faculty):

```powershell
# Ensure you are in the database directory
cd database

# Run the seed script
python seed.py

# Apply the generated seed data
mysql -u root -p pathshala_db < seed_data.sql
```

## 5. Verification
Login to MySQL again and check the tables:

```sql
USE pathshala_db;
SHOW TABLES;
SELECT COUNT(*) FROM users;
``` 
-- ## TO SHOW ROLE OF ALL USERS---

SELECT u.id, u.username, u.email, r.name as role 
FROM users u 
JOIN roles r ON u.role_id = r.id;

----- ## TO SHOW DETAIL INFO OF STUDENTS -----

SELECT 
    u.username, 
    s.roll_no, 
    s.first_name, 
    s.last_name, 
    d.name as department, 
    c.name as course,
    s.current_semester
FROM users u
JOIN student_profiles s ON u.id = s.user_id
JOIN departments d ON s.dept_id = d.id
JOIN courses c ON s.course_id = c.id
LIMIT 10;


------ ## TO SHOW FACULTY DETAILS ---------

SELECT 
    u.username, 
    f.employee_id, 
    f.first_name, 
    f.last_name, 
    d.name as department
FROM users u
JOIN faculty_profiles f ON u.id = f.user_id
JOIN departments d ON f.dept_id = d.id
LIMIT 10;

------- ## TO CHECK FOLDER STRUCTURE ----------
DESCRIBE users;
DESCRIBE student_profiles;
DESCRIBE faculty_profiles;
DESCRIBE admin;

### *1. Admin Credentials*
##  *   *Password*: admin@pathshala
------- ## ADMIN PASSWORD-------
UPDATE users SET password_hash = '$2b$12$FP11c2/fmLMV2PV.qIeYfun30kqb1dt4OwC/q8/z4uj4MP2XaG0bK' 
WHERE username = 'admin';


### *2. HOD & Faculty Credentials*
------- *   *Password*: faculty@pathshala
----- FACULTY PASSWORD CHANGE
UPDATE users SET password_hash = '$2b$12$BR8HtRwrYF4TW5lAOZuE4eQbUvk3HqZ.iJO9XpiE.f.KEZPv.cEqS' 
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('HOD', 'FACULTY'));



### *3. Student Credentials*
------ *   *Password*: student@pathshala
-------- STUDENT PASSWORD CHANGE-----
UPDATE users SET password_hash = '$2b$12$cmgDkq6jIKqKJhfp5NtXte6qOIpuYQVyNo0JGROE.lE83pi2rEZWm' 
WHERE role_id IN (SELECT id FROM roles WHERE name = 'STUDENT');













