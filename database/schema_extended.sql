-- Extended Database Schema for Pathshala ERP

-- 1. FEES MODULE
CREATE TABLE fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    academic_year VARCHAR(10),
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    fee_structure_id INT,
    amount_paid DECIMAL(10,2),
    payment_date DATE,
    payment_method VARCHAR(50),
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES student_profiles(id),
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id)
);

-- 2. EXAMS MODULE
CREATE TABLE exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    exam_date DATE,
    exam_time TIME,
    duration_minutes INT,
    exam_type VARCHAR(50), -- Midterm, Final, Practical
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    exam_schedule_id INT,
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES student_profiles(id),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id)
);

-- 3. ASSIGNMENTS MODULE
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    faculty_id INT,
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    max_marks DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id)
);

CREATE TABLE assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    submission_date DATETIME,
    file_path VARCHAR(255),
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES student_profiles(id)
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
    status ENUM('Issued', 'Returned', 'Overdue') DEFAULT 'Issued',
    FOREIGN KEY (student_id) REFERENCES student_profiles(id),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id),
    FOREIGN KEY (book_id) REFERENCES library_books(id)
);

-- 5. NOTIFICATIONS
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. LEAVE MANAGEMENT
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);
