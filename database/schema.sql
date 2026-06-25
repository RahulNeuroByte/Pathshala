-- Pathshala ERP: Core Database Schema

-- 1. Master Tables
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dept_id INT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    duration_years INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments (id)
);

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    credits INT DEFAULT 4,
    FOREIGN KEY (course_id) REFERENCES courses (id)
);

CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE, -- e.g., 2023-24
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. User Management
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE -- ADMIN, HOD, FACULTY, STUDENT
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- 3. Student & Faculty Profiles
CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    roll_no VARCHAR(20) NOT NULL UNIQUE,
    enrollment_no VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    phone VARCHAR(15),
    address TEXT,
    dept_id INT,
    course_id INT,
    current_semester INT DEFAULT 1,
    batch VARCHAR(20),
    personal_email VARCHAR(100),
    pathshala_email VARCHAR(100),
    alternative_phone VARCHAR(15),
    father_name VARCHAR(100),
    father_occupation VARCHAR(100),
    mother_name VARCHAR(100),
    mother_occupation VARCHAR(100),
    permanent_address TEXT,
    current_address TEXT,
    blood_group VARCHAR(10),
    section VARCHAR(10) DEFAULT 'A',
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (dept_id) REFERENCES departments (id),
    FOREIGN KEY (course_id) REFERENCES courses (id)
);

CREATE TABLE faculty_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    designation VARCHAR(50),
    dept_id INT,
    specialization VARCHAR(100),
    batch VARCHAR(20),
    personal_email VARCHAR(100),
    pathshala_email VARCHAR(100),
    alternative_phone VARCHAR(15),
    father_name VARCHAR(100),
    father_occupation VARCHAR(100),
    mother_name VARCHAR(100),
    mother_occupation VARCHAR(100),
    permanent_address TEXT,
    current_address TEXT,
    blood_group VARCHAR(10),
    section VARCHAR(10) DEFAULT NULL,
    course_id INT DEFAULT NULL,
    current_semester INT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (dept_id) REFERENCES departments (id),
    FOREIGN KEY (course_id) REFERENCES courses (id)
);

-- 4. Academic Transactional Tables
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    session_id INT,
    name VARCHAR(50) NOT NULL, -- e.g., CS-2023-A
    FOREIGN KEY (course_id) REFERENCES courses (id),
    FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    faculty_id INT,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Late') DEFAULT 'Present',
    FOREIGN KEY (student_id) REFERENCES student_profiles (id),
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles (id)
);

CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    exam_type VARCHAR(20), -- Internal, External, Practical
    marks_obtained DECIMAL(5, 2),
    max_marks DECIMAL(5, 2),
    FOREIGN KEY (student_id) REFERENCES student_profiles (id),
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

-- Pathshala ERP: Extended Database Schema

-- 1. FEES MODULE
CREATE TABLE fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    academic_year VARCHAR(10),
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses (id)
);

CREATE TABLE fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    fee_structure_id INT,
    amount_paid DECIMAL(10, 2),
    payment_date DATE,
    payment_method VARCHAR(50),
    status ENUM(
        'Pending',
        'Completed',
        'Failed'
    ) DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES student_profiles (id),
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures (id)
);

-- 2. EXAMS MODULE
CREATE TABLE exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    exam_date DATE,
    exam_time TIME,
    duration_minutes INT,
    exam_type VARCHAR(50), -- Midterm, Final, Practical
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE TABLE exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    exam_schedule_id INT,
    marks_obtained DECIMAL(5, 2),
    max_marks DECIMAL(5, 2),
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES student_profiles (id),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules (id)
);

-- 3. ASSIGNMENTS MODULE
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    faculty_id INT,
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    max_marks DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles (id)
);

CREATE TABLE assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    submission_date DATETIME,
    file_path VARCHAR(255),
    marks_obtained DECIMAL(5, 2),
    feedback TEXT,
    FOREIGN KEY (assignment_id) REFERENCES assignments (id),
    FOREIGN KEY (student_id) REFERENCES student_profiles (id)
);

-- 4. LIBRARY MODULE
CREATE TABLE library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    author VARCHAR(100),
    isbn VARCHAR(20),
    quantity_available INT,
    quantity_total INT,
    publication_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_issuance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    faculty_id INT DEFAULT NULL,
    book_id INT,
    issue_date DATE,
    due_date DATE,
    return_date DATE,
    status ENUM(
        'Issued',
        'Returned',
        'Overdue'
    ) DEFAULT 'Issued',
    FOREIGN KEY (student_id) REFERENCES student_profiles (id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles (id),
    FOREIGN KEY (book_id) REFERENCES library_books (id)
);

CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    day VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT
);

-- 5. NOTIFICATIONS
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 6. LEAVE MANAGEMENT
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 7. PERMISSIONS & RBAC
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    permission_id INT,
    FOREIGN KEY (role_id) REFERENCES roles (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id),
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- 8. NEW ERP ADDITIONS
CREATE TABLE salary_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Paid',
    receipt_no VARCHAR(50) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    host_id INT,
    target_role VARCHAR(50) DEFAULT NULL, -- e.g. "HOD", "FACULTY", etc.
    FOREIGN KEY (host_id) REFERENCES users (id)
);