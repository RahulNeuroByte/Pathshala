from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, DateTime, Enum, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.session import Base

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
    status = Column(String(20), default="Pending")

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

class BookIssuance(Base):
    __tablename__ = "book_issuance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"))
    book_id = Column(Integer, ForeignKey("library_books.id"))
    issue_date = Column(Date)
    due_date = Column(Date)
    return_date = Column(Date)
    status = Column(String(20), default="Issued")

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
    status = Column(String(20), default="Pending")
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
