import random
import string
from datetime import date, datetime, timedelta

def generate_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def generate_seed_sql():
    sql_statements = []
    
    # Disable foreign key checks to allow truncating or clean insert
    sql_statements.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_statements.append("TRUNCATE TABLE role_permissions;")
    sql_statements.append("TRUNCATE TABLE permissions;")
    sql_statements.append("TRUNCATE TABLE book_issuance;")
    sql_statements.append("TRUNCATE TABLE library_books;")
    sql_statements.append("TRUNCATE TABLE assignment_submissions;")
    sql_statements.append("TRUNCATE TABLE assignments;")
    sql_statements.append("TRUNCATE TABLE exam_results;")
    sql_statements.append("TRUNCATE TABLE exam_schedules;")
    sql_statements.append("TRUNCATE TABLE fee_payments;")
    sql_statements.append("TRUNCATE TABLE fee_structures;")
    sql_statements.append("TRUNCATE TABLE attendance;")
    sql_statements.append("TRUNCATE TABLE batches;")
    sql_statements.append("TRUNCATE TABLE student_profiles;")
    sql_statements.append("TRUNCATE TABLE faculty_profiles;")
    sql_statements.append("TRUNCATE TABLE users;")
    sql_statements.append("TRUNCATE TABLE roles;")
    sql_statements.append("TRUNCATE TABLE subjects;")
    sql_statements.append("TRUNCATE TABLE courses;")
    sql_statements.append("TRUNCATE TABLE departments;")
    sql_statements.append("TRUNCATE TABLE sessions;")
    sql_statements.append("TRUNCATE TABLE holidays;")
    sql_statements.append("TRUNCATE TABLE notifications;")
    sql_statements.append("TRUNCATE TABLE leave_requests;")
    sql_statements.append("TRUNCATE TABLE salary_payments;")
    sql_statements.append("TRUNCATE TABLE meetings;")
    sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;")

    # 1. Roles
    # 1: ADMIN, 2: HOD, 3: FACULTY, 4: STUDENT, 5: PRINCIPAL, 6: LIBRARIAN, 7: CLASS_COUNSELLOR
    roles = [
        ('ADMIN', 1), ('HOD', 2), ('FACULTY', 3), ('STUDENT', 4),
        ('PRINCIPAL', 5), ('LIBRARIAN', 6), ('CLASS_COUNSELLOR', 7)
    ]
    for name, rid in roles:
        sql_statements.append(f"INSERT INTO roles (id, name) VALUES ({rid}, '{name}');")

    # 2. Departments
    depts = [
        ('Computer Science', 'cse', 1),
        ('Electronics & Comm', 'ece', 2),
        ('Mechanical Eng', 'mec', 3),
        ('Civil Eng', 'civ', 4),
        ('Business Admin', 'bba', 5)
    ]
    for name, code, did in depts:
        sql_statements.append(f"INSERT INTO departments (id, name, code) VALUES ({did}, '{name}', '{code}');")

    # 3. Sessions
    sql_statements.append("INSERT INTO sessions (id, name, start_date, end_date, is_active) VALUES (1, '2023-24', '2023-07-01', '2024-06-30', 1);")

    # 4. Courses & Subjects
    # 5 courses (CS, EC, ME, CE, BA)
    courses = []
    for i, (dept_name, dept_code, dept_id) in enumerate(depts):
        course_id = i + 1
        course_name = f"B.Tech {dept_code.upper()}" if dept_code != 'bba' else "BBA"
        course_code = f"{dept_code.upper()}-BTECH" if dept_code != 'bba' else "BBA-CORE"
        courses.append((course_id, dept_id, course_name, course_code, 4))
        sql_statements.append(f"INSERT INTO courses (id, dept_id, name, code, duration_years) VALUES ({course_id}, {dept_id}, '{course_name}', '{course_code}', 4);")

    # Subjects: 4 per semester per course for semesters 1 to 8
    # Total subjects = 5 courses * 8 semesters * 4 subjects = 160 subjects
    subjects = []
    subject_names_pool = {
        'cse': ["Programming in C", "Data Structures", "Algorithms", "Operating Systems", "Database Systems", "Computer Networks", "Software Engineering", "Theory of Computation", "Compiler Design", "Web Development", "Artificial Intelligence", "Machine Learning", "Cloud Computing", "Information Security", "Distributed Systems", "Object Oriented Design"],
        'ece': ["Basic Electronics", "Digital Electronics", "Network Analysis", "Signals & Systems", "Microprocessors", "Analog Communications", "Digital Communications", "Electromagnetics", "VLSI Design", "Control Systems", "Embedded Systems", "Antenna Theory", "Optical Fiber Comm", "Satellite Comm", "Radar Engineering", "Signal Processing"],
        'mec': ["Engineering Mechanics", "Thermodynamics", "Material Science", "Fluid Mechanics", "Strength of Materials", "Kinematics", "Manufacturing Tech", "Machine Design", "Heat Transfer", "IC Engines", "Mechatronics", "CAD/CAM", "Automobile Engineering", "Power Plant Eng", "Robotics", "Industrial Safety"],
        'civ': ["Surveying", "Building Materials", "Structural Analysis", "Fluid Mechanics Civ", "Concrete Technology", "Transportation Eng", "Soil Mechanics", "Environmental Eng", "Hydrology", "Steel Design", "Foundation Eng", "Irrigation Eng", "Construction Mgmt", "Bridge Engineering", "Town Planning", "GIS & Remote Sensing"],
        'bba': ["Principles of Management", "Financial Accounting", "Microeconomics", "Business Communication", "Organizational Behavior", "Macroeconomics", "Marketing Management", "Human Resource Mgmt", "Business Statistics", "Financial Management", "Consumer Behavior", "Business Law", "Strategic Management", "Operations Research", "International Business", "Entrepreneurship"]
    }
    
    subject_counter = 1
    for course_id, dept_id, course_name, course_code, duration in courses:
        dept_code = depts[dept_id - 1][1]
        pool = subject_names_pool.get(dept_code, ["Core Subject A", "Core Subject B"])
        for sem in range(1, 9):
            for sub_idx in range(1, 5): # 4 subjects per sem
                # Select a name from pool or generate
                pool_idx = ((sem - 1) * 4 + (sub_idx - 1)) % len(pool)
                sub_name = f"{pool[pool_idx]} (Sem {sem})"
                sub_code = f"{dept_code.upper()}-{sem}0{sub_idx}"
                credits = random.choice([3, 4])
                subjects.append((subject_counter, course_id, sem, sub_name, sub_code, credits))
                sql_statements.append(
                    f"INSERT INTO subjects (id, course_id, name, code, credits) VALUES "
                    f"({subject_counter}, {course_id}, '{sub_name}', '{sub_code}', {credits});"
                )
                subject_counter += 1

    # 5. Users and Profiles
    # Hashes: 
    # 'admin' -> admin@pathshala -> '$2b$12$FP11c2/fmLMV2PV.qIeYfun30kqb1dt4OwC/q8/z4uj4MP2XaG0bK'
    # Staff / HOD / Principal -> faculty@pathshala -> '$2b$12$BR8HtRwrYF4TW5lAOZuE4eQbUvk3HqZ.iJO9XpiE.f.KEZPv.cEqS'
    # Student -> student@pathshala -> '$2b$12$cmgDkq6jIKqKJhfp5NtXte6qOIpuYQVyNo0JGROE.lE83pi2rEZWm'
    admin_hash = "$2b$12$FP11c2/fmLMV2PV.qIeYfun30kqb1dt4OwC/q8/z4uj4MP2XaG0bK"
    faculty_hash = "$2b$12$BR8HtRwrYF4TW5lAOZuE4eQbUvk3HqZ.iJO9XpiE.f.KEZPv.cEqS"
    student_hash = "$2b$12$cmgDkq6jIKqKJhfp5NtXte6qOIpuYQVyNo0JGROE.lE83pi2rEZWm"

    # User counter starts at 1
    user_counter = 1
    
    # Create Super Admin
    sql_statements.append(
        f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
        f"({user_counter}, 1, 'admin', 'admin@pathshala.edu', '{admin_hash}', 1);"
    )
    user_counter += 1

    # Create Principal (role_id = 5)
    principal_user_id = user_counter
    sql_statements.append(
        f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
        f"({principal_user_id}, 5, 'principal', 'principal@pathshala.edu.in', '{faculty_hash}', 1);"
    )
    sql_statements.append(
        f"INSERT INTO faculty_profiles (id, user_id, employee_id, first_name, last_name, designation, dept_id, specialization, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group) VALUES "
        f"(1, {principal_user_id}, 'PRIN001', 'Dr. Devendra', 'Prasad', 'Principal', NULL, 'Academic Admin', '2020', 'dprasad.personal@gmail.com', 'principal@pathshala.edu.in', '9876543210', 'Ram Prasad', 'Retired HOD', 'Sita Devi', 'Homemaker', '12, Gandhi Nagar, Patna, Bihar', 'Campus Principal Bungalow, Pathshala Campus', 'B+');"
    )
    user_counter += 1
    faculty_profile_counter = 2

    # Create Librarian (role_id = 6)
    librarian_user_id = user_counter
    sql_statements.append(
        f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
        f"({librarian_user_id}, 6, 'librarian', 'librarian@pathshala.edu.in', '{faculty_hash}', 1);"
    )
    sql_statements.append(
        f"INSERT INTO faculty_profiles (id, user_id, employee_id, first_name, last_name, designation, dept_id, specialization, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group) VALUES "
        f"({faculty_profile_counter}, {librarian_user_id}, 'LIB001', 'Mrs. Anita', 'Sharma', 'Librarian', NULL, 'Library Sciences', '2021', 'anita.lib.personal@gmail.com', 'librarian@pathshala.edu.in', '9898989898', 'Krishan Kumar', 'Teacher', 'Radha Devi', 'Homemaker', '45, Civil Lines, Jaipur, Rajasthan', 'Staff Quarter Q3, Pathshala Campus', 'O+');"
    )
    user_counter += 1
    faculty_profile_counter += 1

    # 5 HODs (role_id = 2, one per department)
    hod_profiles = []
    for i, (dept_name, dept_code, dept_id) in enumerate(depts):
        hod_user_id = user_counter
        username = f"hod.{dept_code}"
        email = f"hod.{dept_code}@pathshala.edu.in"
        sql_statements.append(
            f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
            f"({hod_user_id}, 2, '{username}', '{email}', '{faculty_hash}', 1);"
        )
        first_names = ['Rajesh', 'Sanjay', 'Amit', 'Vikram', 'Suresh']
        last_names = ['Sharma', 'Gupta', 'Patel', 'Singh', 'Rao']
        sql_statements.append(
            f"INSERT INTO faculty_profiles (id, user_id, employee_id, first_name, last_name, designation, dept_id, specialization, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group) VALUES "
            f"({faculty_profile_counter}, {hod_user_id}, 'EMP200{dept_id}', '{first_names[i]}', '{last_names[i]}', 'HOD', {dept_id}, 'Advanced Research', '2019', '{username}.personal@gmail.com', '{email}', '912345678{dept_id}', 'Father HOD {dept_id}', 'Retired', 'Mother HOD {dept_id}', 'Homemaker', 'Address HOD {dept_id}', 'Staff Quarter H{dept_id}, Pathshala Campus', 'AB+');"
        )
        hod_profiles.append((faculty_profile_counter, hod_user_id, dept_id, f"{first_names[i]} {last_names[i]}"))
        user_counter += 1
        faculty_profile_counter += 1

    # 5 Class Counsellors (role_id = 7, one per department/course, assigned to Section A, Semester 3)
    cc_profiles = []
    for i, (dept_name, dept_code, dept_id) in enumerate(depts):
        cc_user_id = user_counter
        username = f"cc.{dept_code}"
        email = f"cc.{dept_code}@pathshala.edu.in"
        sql_statements.append(
            f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
            f"({cc_user_id}, 7, '{username}', '{email}', '{faculty_hash}', 1);"
        )
        first_names = ['Alok', 'Manoj', 'Deepak', 'Sunil', 'Karan']
        last_names = ['Verma', 'Mishra', 'Shah', 'Das', 'Joshi']
        sql_statements.append(
            f"INSERT INTO faculty_profiles (id, user_id, employee_id, first_name, last_name, designation, dept_id, specialization, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group, section, course_id, current_semester) VALUES "
            f"({faculty_profile_counter}, {cc_user_id}, 'EMP300{dept_id}', '{first_names[i]}', '{last_names[i]}', 'Class Counsellor', {dept_id}, 'Student Counselling', '2020', '{username}.personal@gmail.com', '{email}', '923456789{dept_id}', 'Father CC {dept_id}', 'Business', 'Mother CC {dept_id}', 'Teacher', 'Address CC {dept_id}', 'Staff Quarter C{dept_id}, Pathshala Campus', 'A+', 'A', {dept_id}, 3);"
        )
        cc_profiles.append((faculty_profile_counter, cc_user_id, dept_id, f"{first_names[i]} {last_names[i]}"))
        user_counter += 1
        faculty_profile_counter += 1

    # 40 Faculty Members (role_id = 3, distributed across departments)
    faculty_list = []
    domains = ['Algorithms', 'VLSI', 'Machine Design', 'Transportation', 'Finance', 'Web Tech', 'Microprocessors', 'Thermal Eng', 'Structural Design', 'HR Management']
    for i in range(1, 41):
        fac_user_id = user_counter
        username = f"faculty{i}"
        email = f"{username}@pathshala.edu.in"
        dept_id = ((i - 1) % 5) + 1
        sql_statements.append(
            f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
            f"({fac_user_id}, 3, '{username}', '{email}', '{faculty_hash}', 1);"
        )
        first_name = f"ProfName{i}"
        last_name = "User"
        designation = random.choice(['Professor', 'Associate Professor', 'Assistant Professor'])
        sql_statements.append(
            f"INSERT INTO faculty_profiles (id, user_id, employee_id, first_name, last_name, designation, dept_id, specialization, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group) VALUES "
            f"({faculty_profile_counter}, {fac_user_id}, 'EMP10{10+i}', '{first_name}', '{last_name}', '{designation}', {dept_id}, '{domains[i % len(domains)]}', '2022', '{username}.personal@gmail.com', '{email}', '9555555{10+i}', 'Father Fac {i}', 'Service', 'Mother Fac {i}', 'Homemaker', 'Permanent Address Faculty {i}', 'Staff Quarter F{i}, Pathshala Campus', '{random.choice(['A+', 'B+', 'O+', 'AB+'])}');"
        )
        faculty_list.append((faculty_profile_counter, fac_user_id, dept_id, f"{first_name} {last_name}"))
        user_counter += 1
        faculty_profile_counter += 1

    # 500 Students (role_id = 4)
    # Evenly distributed across 5 departments, 8 semesters, and 2 sections (A and B)
    # Total cohorts = 5 * 8 * 2 = 80 cohorts. Around 6 to 7 students per cohort.
    student_profile_counter = 1
    indian_first_names = ['Aarav', 'Kabir', 'Vivaan', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Arnav', 'Krishna', 'Ishan', 'Shaurya', 'Atharva', 'Ananya', 'Diya', 'Aaradhya', 'Advika', 'Pihu', 'Khushi', 'Myra', 'Anvi', 'Ira', 'Riya', 'Rahul', 'Amit', 'Priyesh', 'Rajesh', 'Sneha', 'Pooja', 'Neha', 'Priya', 'Akash', 'Vikas', 'Sachin', 'Sunil', 'Anil', 'Divya', 'Kavita', 'Jyoti', 'Ramesh', 'Suresh', 'Simran', 'Ishita', 'Aayush', 'Harsh', 'Tushar', 'Pranav', 'Nikhil', 'Rohan', 'Abhishek', 'Karan']
    indian_last_names = ['Kumar', 'Sharma', 'Patel', 'Gupta', 'Mehta', 'Singh', 'Joshi', 'Rao', 'Nair', 'Sen', 'Reddy', 'Roy', 'Banerjee', 'Mishra', 'Shah', 'Verma', 'Das', 'Patil', 'Desai', 'Bhat', 'Iyer', 'Pillai', 'Choudhury', 'Chawla', 'Kapoor', 'Malhotra', 'Bose']
    father_names = ['Rajesh', 'Ramesh', 'Sunil', 'Anil', 'Suresh', 'Dinesh', 'Sanjay', 'Vijay', 'Vinod', 'Manoj', 'Ashok', 'Alok', 'Pradeep', 'Deepak', 'Satish', 'Harish', 'Mahesh']
    mother_names = ['Sunita', 'Anita', 'Rekha', 'Seema', 'Pooja', 'Aarti', 'Kavita', 'Meena', 'Kiran', 'Geeta', 'Asha', 'Lata', 'Pushpa', 'Shanti']
    occupations = ['Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Farmer', 'Manager', 'Clerk', 'Retired', 'Homemaker', 'Private Service', 'Government Service', 'Consultant']
    blood_groups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']
    
    addresses_pool = [
        "123, MG Road, Sector 4, Bangalore, Karnataka",
        "45, Park Street, Kolkata, West Bengal",
        "Sector 15, Noida, Uttar Pradesh",
        "78, Anna Salai, Chennai, Tamil Nadu",
        "12, Marine Drive, Mumbai, Maharashtra",
        "99, Gachibowli, Hyderabad, Telangana",
        "Kadam Kuan, Patna, Bihar",
        "Civil Lines, Jaipur, Rajasthan",
        "Mall Road, Shimla, Himachal Pradesh",
        "Salt Lake, Sector V, Kolkata"
    ]

    student_profiles_list = []
    
    # Distribute students
    cohort_list = []
    for dept_id in range(1, 6):
        for sem in range(1, 9):
            for sec in ['A', 'B']:
                cohort_list.append((dept_id, sem, sec))
                
    # Loop 500 times to create students
    for i in range(1, 501):
        stud_user_id = user_counter
        
        # Pick cohort cyclically
        cohort = cohort_list[(i - 1) % len(cohort_list)]
        dept_id, sem, sec = cohort
        dept_code = depts[dept_id - 1][1]
        course_id = dept_id # 1-to-1 course-to-dept map
        
        # Formatting roll number and emails
        roll_no = f"222{1000 + i:04d}"
        pathshala_email = f"{roll_no}.{dept_code}@pathshala.edu.in"
        username = f"student{i}"
        
        # Insert user record
        sql_statements.append(
            f"INSERT INTO users (id, role_id, username, email, password_hash, is_active) VALUES "
            f"({stud_user_id}, 4, '{username}', '{pathshala_email}', '{student_hash}', 1);"
        )
        
        # Generate realistic details
        first_name = random.choice(indian_first_names)
        last_name = random.choice(indian_last_names)
        dob_str = str(date(2002, 1, 1) + timedelta(days=random.randint(0, 1000)))
        gender = random.choice(['Male', 'Female'])
        phone = f"98765{i:05d}"
        alt_phone = f"91234{i:05d}"
        father = random.choice(father_names) + " " + last_name
        father_occ = random.choice(occupations)
        mother = random.choice(mother_names) + " " + last_name
        mother_occ = random.choice(occupations)
        perm_addr = random.choice(addresses_pool)
        curr_addr = f"Pathshala Hostel Block {random.choice(['A', 'B', 'C', 'D'])}, Room {random.randint(101, 500)}"
        blood = random.choice(blood_groups)
        batch_year = str(2026 - (sem + 1) // 2) # e.g. sem 3 started in 2024
        
        # Insert student profile record
        sql_statements.append(
            f"INSERT INTO student_profiles (id, user_id, roll_no, enrollment_no, first_name, last_name, dob, gender, phone, address, dept_id, course_id, current_semester, batch, personal_email, pathshala_email, alternative_phone, father_name, father_occupation, mother_name, mother_occupation, permanent_address, current_address, blood_group, section) VALUES "
            f"({student_profile_counter}, {stud_user_id}, '{roll_no}', 'ENR-{roll_no}', '{first_name}', '{last_name}', '{dob_str}', '{gender}', '{phone}', '{curr_addr}', {dept_id}, {course_id}, {sem}, '{batch_year}', '{username}.personal@gmail.com', '{pathshala_email}', '{alt_phone}', '{father}', '{father_occ}', '{mother}', '{mother_occ}', '{perm_addr}', '{curr_addr}', '{blood}', '{sec}');"
        )
        
        student_profiles_list.append({
            'id': student_profile_counter,
            'user_id': stud_user_id,
            'first_name': first_name,
            'last_name': last_name,
            'roll_no': roll_no,
            'email': pathshala_email,
            'dept_id': dept_id,
            'course_id': course_id,
            'semester': sem,
            'section': sec
        })
        
        user_counter += 1
        student_profile_counter += 1

    # 6. Fee Structures (for B.Tech CS, B.Tech EC, B.Tech ME, B.Tech CE, BBA)
    for c in courses:
        course_id = c[0]
        sql_statements.append(f"INSERT INTO fee_structures (id, course_id, academic_year, total_amount) VALUES ({course_id}, {course_id}, '2023-24', {random.randint(75000, 125000)});")

    # 7. Fee Payments (completed/pending invoices for some students)
    # Seed 300 completed/pending payments
    for i in range(1, 301):
        stud = random.choice(student_profiles_list)
        fee_structure_id = stud['course_id']
        amount = random.randint(50000, 75000)
        status = random.choice(['Completed', 'Pending'])
        pay_date = str(date(2024, 1, 1) + timedelta(days=random.randint(0, 150)))
        method = random.choice(['Credit Card', 'Debit Card', 'UPI / NetBanking'])
        sql_statements.append(
            f"INSERT INTO fee_payments (student_id, fee_structure_id, amount_paid, payment_date, payment_method, status) VALUES "
            f"({stud['id']}, {fee_structure_id}, {amount}, '{pay_date}', '{method}', '{status}');"
        )

    # 8. Library Books (30 realistic titles)
    library_books_pool = [
        ('Computer Networks', 'Andrew S. Tanenbaum', 'ISBN-001', 10, 10, 2011),
        ('Introduction to Algorithms', 'Thomas H. Cormen', 'ISBN-002', 8, 8, 2022),
        ('Database System Concepts', 'Abraham Silberschatz', 'ISBN-003', 15, 15, 2019),
        ('Operating System Concepts', 'Peter B. Galvin', 'ISBN-004', 12, 12, 2018),
        ('Software Engineering', 'Ian Sommerville', 'ISBN-005', 9, 9, 2015),
        ('Artificial Intelligence: A Modern Approach', 'Stuart Russell', 'ISBN-006', 7, 7, 2020),
        ('Compilers: Principles, Techniques, Tools', 'Alfred V. Aho', 'ISBN-007', 5, 5, 2006),
        ('Computer Architecture', 'John L. Hennessy', 'ISBN-008', 6, 6, 2017),
        ('Design Patterns', 'Erich Gamma', 'ISBN-009', 10, 10, 1994),
        ('Computer Graphics', 'John F. Hughes', 'ISBN-010', 4, 4, 2013),
        ('Theory of Computation', 'Michael Sipser', 'ISBN-011', 8, 8, 2012),
        ('Data Communications', 'Behrouz A. Forouzan', 'ISBN-012', 14, 14, 2012),
        ('Cryptography & Network Security', 'William Stallings', 'ISBN-013', 11, 11, 2020),
        ('Distributed Systems', 'Andrew S. Tanenbaum', 'ISBN-014', 6, 6, 2016),
        ('Cloud Computing', 'Rajkumar Buyya', 'ISBN-015', 7, 7, 2010),
        ('Digital Design', 'M. Morris Mano', 'ISBN-016', 15, 15, 2017),
        ('Machine Learning', 'Tom M. Mitchell', 'ISBN-017', 12, 12, 1997),
        ('Pattern Recognition & ML', 'Christopher M. Bishop', 'ISBN-018', 8, 8, 2006),
        ('Deep Learning', 'Ian Goodfellow', 'ISBN-019', 10, 10, 2016),
        ('Basic Electrical Systems', 'Vincent Del Toro', 'ISBN-020', 10, 10, 2001),
        ('Engineering Mathematics I', 'E. Kreyszig', 'ISBN-021', 20, 20, 2015),
        ('Applied Physics', 'Arthur Beiser', 'ISBN-022', 15, 15, 2009),
        ('Applied Chemistry', 'O. G. Palanna', 'ISBN-023', 15, 15, 2011),
        ('Discrete Mathematics', 'Kenneth H. Rosen', 'ISBN-024', 12, 12, 2018),
        ('Financial Management', 'Prasanna Chandra', 'ISBN-025', 10, 10, 2017),
        ('Principles of Management', 'Harold Koontz', 'ISBN-026', 10, 10, 2015),
        ('Organizational Behavior', 'Stephen P. Robbins', 'ISBN-027', 10, 10, 2016),
        ('Business Law', 'M.C. Kuchhal', 'ISBN-028', 8, 8, 2018),
        ('Fluid Mechanics', 'Frank M. White', 'ISBN-029', 10, 10, 2015),
        ('Strength of Materials', 'S. Ramamrutham', 'ISBN-030', 12, 12, 2014)
    ]
    
    for idx, b in enumerate(library_books_pool):
        sql_statements.append(
            f"INSERT INTO library_books (id, title, author, isbn, quantity_available, quantity_total, publication_year) VALUES "
            f"({idx+1}, '{b[0]}', '{b[1]}', '{b[2]}', {b[3]}, {b[4]}, {b[5]});"
        )

    # 9. Book Issuance (students & staff)
    # Seed 100 issuances
    for i in range(1, 101):
        book_id = random.randint(1, len(library_books_pool))
        issue_date = str(date(2024, 2, 1) + timedelta(days=random.randint(0, 100)))
        due_date = str(date(2024, 2, 15) + timedelta(days=random.randint(0, 100)))
        status = random.choice(['Issued', 'Returned', 'Overdue'])
        return_date = f"'{str(date(2024, 2, 10) + timedelta(days=random.randint(0, 100)))}'" if status == 'Returned' else 'NULL'
        
        # Mapped to student or faculty/staff
        if random.random() < 0.8: # 80% to students
            stud = random.choice(student_profiles_list)
            sql_statements.append(
                f"INSERT INTO book_issuance (student_id, faculty_id, book_id, issue_date, due_date, return_date, status) VALUES "
                f"({stud['id']}, NULL, {book_id}, '{issue_date}', '{due_date}', {return_date}, '{status}');"
            )
        else: # 20% to staff
            fac_profile_id = random.randint(1, faculty_profile_counter - 1)
            sql_statements.append(
                f"INSERT INTO book_issuance (student_id, faculty_id, book_id, issue_date, due_date, return_date, status) VALUES "
                f"(NULL, {fac_profile_id}, {book_id}, '{issue_date}', '{due_date}', {return_date}, '{status}');"
            )

    # 10. Exam Schedules & Exam Results (to populate StudentResultsPage)
    # Let's seed exam schedules for B.Tech CS, semesters 1 & 2
    # Then seed exam results for students who are in semester 2 or 3 or above
    exam_schedule_counter = 1
    # Gather subjects mapped by course and semester
    # Mapped to a dict: (course_id, sem) -> list of subject IDs
    subjects_by_cohort = {}
    for sub in subjects:
        sub_id, course_id, sem, name, code, credits = sub
        subjects_by_cohort.setdefault((course_id, sem), []).append(sub_id)

    # We will schedule exams for all subjects of all courses for semesters 1 and 2
    scheduled_exams = [] # list of (exam_id, subject_id, sem, course_id)
    for (course_id, sem), sub_ids in subjects_by_cohort.items():
        if sem in [1, 2]: # Seed completed semesters
            for sub_id in sub_ids:
                exam_date = str(date(2023, 12, 10) + timedelta(days=sub_id % 5)) if sem == 1 else str(date(2024, 5, 12) + timedelta(days=sub_id % 5))
                exam_type = 'Final'
                sql_statements.append(
                    f"INSERT INTO exam_schedules (id, subject_id, exam_date, exam_time, duration_minutes, exam_type) VALUES "
                    f"({exam_schedule_counter}, {sub_id}, '{exam_date}', '10:00:00', 180, '{exam_type}');"
                )
                scheduled_exams.append((exam_schedule_counter, sub_id, sem, course_id))
                exam_schedule_counter += 1

    # Now generate exam results for all students in sem >= 2
    # Mapped to their completed semester subjects
    for stud in student_profiles_list:
        stud_id = stud['id']
        stud_sem = stud['semester']
        stud_course = stud['course_id']
        
        # Schedule exams for completed semesters
        completed_sems = [s for s in [1, 2] if s < stud_sem]
        for c_sem in completed_sems:
            # Find exams for this course and sem
            relevant_exams = [e for e in scheduled_exams if e[3] == stud_course and e[2] == c_sem]
            for exam in relevant_exams:
                exam_id, sub_id, _, _ = exam
                # Generate realistic marks (40 to 100)
                marks = random.randint(45, 98)
                
                # Letter grade and grade points mapping based on marks
                if marks >= 89:
                    grade = 'O'
                elif marks >= 79:
                    grade = 'A+'
                elif marks >= 70:
                    grade = 'A'
                elif marks >= 60:
                    grade = 'B+'
                elif marks >= 50:
                    grade = 'B'
                elif marks >= 45:
                    grade = 'C'
                elif marks >= 40:
                    grade = 'P'
                else:
                    grade = 'F'
                
                sql_statements.append(
                    f"INSERT INTO exam_results (student_id, exam_schedule_id, marks_obtained, max_marks, grade) VALUES "
                    f"({stud_id}, {exam_id}, {marks}, 100, '{grade}');"
                )

    # 11. Academic Assignments
    assignment_counter = 1
    # Mapped to CS course
    for sub in subjects:
        sub_id, course_id, sem, name, code, credits = sub
        # Get faculty for this department
        relevant_faculty = [f for f in faculty_list if f[2] == course_id]
        if relevant_faculty:
            fac_prof_id = relevant_faculty[0][0]
            due = str(date(2024, 4, 1) + timedelta(days=sub_id % 20))
            sql_statements.append(
                f"INSERT INTO assignments (id, subject_id, faculty_id, title, description, due_date, max_marks) VALUES "
                f"({assignment_counter}, {sub_id}, {fac_prof_id}, 'Assignment on {name}', 'Please submit a detailed analysis report.', '{due}', 50);"
            )
            assignment_counter += 1

    # 12. Salary Payments records
    # Seed salary dispatches for HODs, CCs, and faculty for May and June 2026
    salary_counter = 1
    months = ['May', 'June']
    staff_user_ids = [principal_user_id, librarian_user_id] + [p[1] for p in hod_profiles] + [p[1] for p in cc_profiles] + [f[1] for f in faculty_list]
    for uid in staff_user_ids:
        # Determine employee designation
        for month in months:
            amount = random.choice([60000.00, 75000.00, 90000.00, 110000.00])
            payment_date = "2026-05-31" if month == "May" else "2026-06-30"
            receipt_no = f"SAL-{uid:03d}-{month.upper()}-2026"
            sql_statements.append(
                f"INSERT INTO salary_payments (id, user_id, amount, payment_date, month, year, status, receipt_no) VALUES "
                f"({salary_counter}, {uid}, {amount}, '{payment_date}', '{month}', 2026, 'Paid', '{receipt_no}');"
            )
            salary_counter += 1

    # 13. Meetings
    # Seed 5 administrative meetings
    meeting_dates = ["2026-07-02", "2026-07-08", "2026-07-15", "2026-07-22", "2026-07-29"]
    meeting_times = ["10:30:00", "14:00:00", "11:00:00", "15:30:00", "09:00:00"]
    meeting_titles = [
        "Annual Curriculum Review Committee Meeting",
        "Librarians & HODs Coordination Discussion",
        "Super Admin Infrastructure Maintenance Meeting",
        "Class Counsellors Progress Alignment",
        "Department Placement Drive Planning Session"
    ]
    for m in range(5):
        sql_statements.append(
            f"INSERT INTO meetings (id, title, description, meeting_date, meeting_time, host_id, target_role) VALUES "
            f"({m+1}, '{meeting_titles[m]}', 'Discussion on upcoming academic events and policy scheduling.', '{meeting_dates[m]}', '{meeting_times[m]}', 1, NULL);"
        )

    # 14. Permissions
    permissions = [
        ("read_users", "Allow reading user data"),
        ("manage_users", "Allow creating, updating, deleting users"),
        ("read_students", "Allow reading student data"),
        ("manage_students", "Allow managing student data"),
        ("read_faculty", "Allow reading faculty data"),
        ("manage_faculty", "Allow managing faculty data"),
        ("manage_fees", "Allow managing fee structures and payments"),
        ("manage_exams", "Allow managing exam schedules and results"),
        ("manage_assignments", "Allow managing assignments and submissions"),
        ("manage_library", "Allow managing library books and issuance"),
        ("view_reports", "Allow viewing reports"),
        ("manage_roles", "Allow managing roles and permissions"),
    ]
    for i, (name, desc) in enumerate(permissions):
        sql_statements.append(f"INSERT INTO permissions (id, name, description) VALUES ({i+1}, '{name}', '{desc}');")

    # 15. Role Permissions (Detailed RBAC)
    # Admin (1) gets all permissions
    for i in range(1, len(permissions) + 1):
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (1, {i});")
    # Principal (5) gets all permissions
    for i in range(1, len(permissions) + 1):
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (5, {i});")
    # HOD (2) gets read_users, read_students, manage_students, read_faculty, manage_faculty, manage_exams
    hod_perms = [1, 3, 4, 5, 6, 8]
    for pid in hod_perms:
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (2, {pid});")
    # Class Counsellor (7) gets read_students, manage_students
    cc_perms = [3, 4]
    for pid in cc_perms:
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (7, {pid});")
    # Faculty (3) gets read_students, read_faculty, manage_assignments, manage_exams
    fac_perms = [3, 5, 8, 9]
    for pid in fac_perms:
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (3, {pid});")
    # Librarian (6) gets manage_library
    lib_perms = [10]
    for pid in lib_perms:
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (6, {pid});")
    # Student (4) gets read_students, read_faculty, view_reports
    stud_perms = [3, 5, 11]
    for pid in stud_perms:
        sql_statements.append(f"INSERT INTO role_permissions (role_id, permission_id) VALUES (4, {pid});")

    # 16. Seed Holidays
    holidays_data = [
        ("Independence Day", "2025-08-15", "Friday", "Gazetted", "National Holiday commemorating Independence from British Rule."),
        ("Raksha Bandhan", "2025-08-09", "Saturday", "Restricted", "Traditional Hindu festival celebrating sibling bonds."),
        ("Janmashtami", "2025-08-16", "Saturday", "Restricted", "Birth anniversary of Lord Krishna."),
        ("Ganesh Chaturthi", "2025-08-27", "Wednesday", "Restricted", "Celebrating the arrival of Lord Ganesha."),
        ("Gandhi Jayanti", "2025-10-02", "Thursday", "Gazetted", "Birth anniversary of Mahatma Gandhi."),
        ("Dussehra / Vijayadashami", "2025-10-02", "Thursday", "Gazetted", "Victory of good over evil, Lord Rama\\'s victory."),
        ("Diwali (Deepavali)", "2025-10-20", "Monday", "Gazetted", "Festival of lights celebrating return of Lord Rama."),
        ("Guru Nanak Jayanti", "2025-11-05", "Wednesday", "Gazetted", "Birth anniversary of Guru Nanak Dev Ji."),
        ("Christmas Day", "2025-12-25", "Thursday", "Gazetted", "Celebrating the birth of Jesus Christ."),
        ("Winter Vacation", "2025-12-26", "Friday to Wednesday (6 days)", "Academic Break", "Annual institutional winter recess."),
        ("Republic Day", "2026-01-26", "Monday", "Gazetted", "Celebrating the adoption of the Constitution of India."),
        ("Maha Shivratri", "2026-02-15", "Sunday", "Restricted", "Great night of Shiva, Hindu festival."),
        ("Holi Festival", "2026-03-04", "Wednesday", "Gazetted", "Festival of colors celebrating arrival of Spring."),
        ("Good Friday", "2026-04-03", "Friday", "Gazetted", "Christian holiday commemorating the crucifixion of Jesus Christ."),
        ("Eid ul-Fitr", "2026-03-20", "Friday", "Gazetted", "Muslim festival marking the end of Ramadan."),
        ("Summer Recess", "2026-06-01", "Monday to Tuesday (30 days)", "Academic Break", "Annual institutional summer vacation.")
    ]
    for name, date_str, day, htype, desc in holidays_data:
        sql_statements.append(f"INSERT INTO holidays (name, date, day, type, description) VALUES ('{name}', '{date_str}', '{day}', '{htype}', '{desc}');")

    # 17. Seed Notices / Notifications
    sql_statements.append("INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'Annual Tech Fest \"PathshalaHack 2026\" Registrations Open', 'Registrations are now open for the annual technical hackathon PathshalaHack 2026. Exciting prizes up to Rs. 1 Lakh!');")
    sql_statements.append("INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'Midterm Grade Cards are now live on student dashboards', 'Please check your finalized grade cards in your individual portals. Report discrepancies to HOD office.');")
    sql_statements.append("INSERT INTO notifications (user_id, title, message) VALUES (NULL, 'Server maintenance scheduled for June 24 at 12:00 AM', 'ERP services will be temporarily offline for routine backup and security patches.');")

    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, 'seed_data.sql')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_statements))
    print(f"Seed SQL successfully generated at: {output_path}")

    # Directly run script using python database execution if possible
    # We will read DATABASE_URL from .env and run it using sqlalchemy
    # This simplifies deployment immensely!
    try:
        from sqlalchemy import create_engine, text
        import re
        
        # Load .env manually to avoid extra library dependencies
        env_vars = {}
        env_path = os.path.join(os.path.dirname(current_dir), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as env_file:
                for line in env_file:
                    if '=' in line and not line.startswith('#'):
                        k, v = line.strip().split('=', 1)
                        env_vars[k.strip()] = v.strip().strip('"').strip("'")
        
        db_url = env_vars.get('DATABASE_URL')
        if db_url:
            print("Connecting to database to execute seeding queries...")
            engine = create_engine(db_url)
            with engine.begin() as conn:
                for stmt in sql_statements:
                    if stmt.strip() and not stmt.strip().startswith('--'):
                        # Remove trailing semicolon for sqlalchemy execution
                        cleaned_stmt = stmt.strip().rstrip(';')
                        conn.execute(text(cleaned_stmt))
            print("Successfully populated database directly via Python script!")
    except Exception as e:
        print(f"Could not seed database directly: {e}")
        print("Please apply the generated 'seed_data.sql' file using MySQL command line.")

if __name__ == "__main__":
    generate_seed_sql()
