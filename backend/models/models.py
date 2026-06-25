from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, DateTime, Enum, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.session import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_photo = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    role = relationship("Role", back_populates="users")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    dept_id = Column(Integer, ForeignKey("departments.id"))
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    duration_years = Column(Integer, nullable=False)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    credits = Column(Integer, default=4)

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    roll_no = Column(String(20), unique=True, nullable=False)
    enrollment_no = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    dob = Column(Date)
    gender = Column(String(10))
    phone = Column(String(15))
    address = Column(Text)
    dept_id = Column(Integer, ForeignKey("departments.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    current_semester = Column(Integer, default=1)
    batch = Column(String(20))
    personal_email = Column(String(100))
    pathshala_email = Column(String(100))
    alternative_phone = Column(String(15))
    father_name = Column(String(100))
    father_occupation = Column(String(100))
    mother_name = Column(String(100))
    mother_occupation = Column(String(100))
    permanent_address = Column(Text)
    current_address = Column(Text)
    blood_group = Column(String(10))
    section = Column(String(10), default="A")
    
    user = relationship("User", back_populates="student_profile")

class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    employee_id = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    designation = Column(String(50))
    dept_id = Column(Integer, ForeignKey("departments.id"))
    specialization = Column(String(100))
    batch = Column(String(20))
    personal_email = Column(String(100))
    pathshala_email = Column(String(100))
    alternative_phone = Column(String(15))
    father_name = Column(String(100))
    father_occupation = Column(String(100))
    mother_name = Column(String(100))
    mother_occupation = Column(String(100))
    permanent_address = Column(Text)
    current_address = Column(Text)
    blood_group = Column(String(10))
    section = Column(String(10), default=None)
    course_id = Column(Integer, ForeignKey("courses.id"), default=None)
    current_semester = Column(Integer, default=None)
    
    user = relationship("User", back_populates="faculty_profile")


class FeeStructure(Base):
    __tablename__ = "fee_structures"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    academic_year = Column(String(10))
    total_amount = Column(DECIMAL(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FeePayment(Base):
    __tablename__ = "fee_payments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"))
    amount_paid = Column(DECIMAL(10, 2))
    payment_date = Column(Date)
    payment_method = Column(String(50))
    status = Column(Enum("Pending", "Completed", "Failed"), default="Pending")

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    exam_date = Column(Date)
    exam_time = Column(String(8))
    duration_minutes = Column(Integer)
    exam_type = Column(String(50))

class ExamResult(Base):
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    exam_schedule_id = Column(Integer, ForeignKey("exam_schedules.id"))
    marks_obtained = Column(DECIMAL(5, 2))
    max_marks = Column(DECIMAL(5, 2))
    grade = Column(String(2))

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"))
    title = Column(String(255))
    description = Column(Text)
    due_date = Column(Date)
    max_marks = Column(DECIMAL(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    faculty_profile = relationship("FacultyProfile")
    subject = relationship("Subject")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    submission_date = Column(DateTime)
    file_path = Column(String(255))
    marks_obtained = Column(DECIMAL(5, 2))
    feedback = Column(Text)

class LibraryBook(Base):
    __tablename__ = "library_books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    author = Column(String(100))
    isbn = Column(String(20))
    quantity_available = Column(Integer)
    quantity_total = Column(Integer)
    publication_year = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BookIssuance(Base):
    __tablename__ = "book_issuance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"), nullable=True)
    book_id = Column(Integer, ForeignKey("library_books.id"))
    issue_date = Column(Date)
    due_date = Column(Date)
    return_date = Column(Date)
    status = Column(Enum("Issued", "Returned", "Overdue"), default="Issued")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    leave_type = Column(String(50))
    start_date = Column(Date)
    end_date = Column(Date)
    reason = Column(Text)
    status = Column(Enum("Pending", "Approved", "Rejected"), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    description = Column(Text)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    permission_id = Column(Integer, ForeignKey("permissions.id"))

class Holiday(Base):
    __tablename__ = "holidays"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date = Column(String(100), nullable=False)
    day = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

class SalaryPayment(Base):
    __tablename__ = "salary_payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    month = Column(String(20), nullable=False)
    year = Column(Integer, nullable=False)
    status = Column(String(20), default="Paid")
    receipt_no = Column(String(50), unique=True)

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    meeting_date = Column(Date, nullable=False)
    meeting_time = Column(String(20), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"))
    target_role = Column(String(50), default=None)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"))
    date = Column(Date, nullable=False)
    status = Column(Enum("Present", "Absent", "Late"), default="Present")

class StaffAttendance(Base):
    __tablename__ = "staff_attendance"
    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"))
    date = Column(Date, nullable=False)
    status = Column(Enum("Pending", "Present", "Absent"), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    faculty_profile = relationship("FacultyProfile")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    room_type = Column(String(50), nullable=False)  # "PRINCIPAL_HOD" or "DEPT_FACULTY"
    dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    department = relationship("Department", foreign_keys=[dept_id])


class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dept_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    department = relationship("Department", foreign_keys=[dept_id])


