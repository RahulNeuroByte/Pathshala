from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from decimal import Decimal

# --- AUTH & USER ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_active: Optional[bool] = True
    profile_photo: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int

class UserOut(UserBase):
    id: int
    role_id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- MASTER DATA ---
class DepartmentBase(BaseModel):
    name: str
    code: str

class CourseBase(BaseModel):
    dept_id: int
    name: str
    code: str
    duration_years: int

class SubjectBase(BaseModel):
    course_id: int
    name: str
    code: str
    credits: int

# --- PROFILES ---
class StudentProfileBase(BaseModel):
    user_id: int
    roll_no: str
    enrollment_no: str
    first_name: str
    last_name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    dept_id: int
    course_id: int
    current_semester: int
    batch: Optional[str] = None
    personal_email: Optional[str] = None
    pathshala_email: Optional[str] = None
    alternative_phone: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    blood_group: Optional[str] = None
    section: Optional[str] = "A"

class StudentCreate(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    roll_no: str
    enrollment_no: str
    dept_id: int
    course_id: int
    current_semester: Optional[int] = 1
    batch: Optional[str] = None
    personal_email: Optional[str] = None
    alternative_phone: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    blood_group: Optional[str] = None
    section: Optional[str] = "A"

class FacultyProfileBase(BaseModel):
    user_id: int
    employee_id: str
    first_name: str
    last_name: str
    dept_id: int
    designation: Optional[str] = None
    specialization: Optional[str] = None
    batch: Optional[str] = None
    personal_email: Optional[str] = None
    pathshala_email: Optional[str] = None
    alternative_phone: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    blood_group: Optional[str] = None
    section: Optional[str] = None
    course_id: Optional[int] = None
    current_semester: Optional[int] = None

class FacultyCreate(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    employee_id: str
    dept_id: int
    designation: Optional[str] = None
    specialization: Optional[str] = None
    batch: Optional[str] = None
    personal_email: Optional[str] = None
    alternative_phone: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    blood_group: Optional[str] = None
    section: Optional[str] = None
    course_id: Optional[int] = None
    current_semester: Optional[int] = None

class SalaryPaymentBase(BaseModel):
    user_id: int
    amount: Decimal
    payment_date: date
    month: str
    year: int
    status: Optional[str] = "Paid"
    receipt_no: Optional[str] = None

class SalaryPaymentOut(SalaryPaymentBase):
    id: int
    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_date: date
    meeting_time: str
    host_id: int
    target_role: Optional[str] = None

class MeetingOut(MeetingBase):
    id: int
    class Config:
        from_attributes = True

# --- FEES ---
class FeeStructureBase(BaseModel):
    course_id: int
    academic_year: str
    total_amount: Decimal

class FeePaymentBase(BaseModel):
    student_id: int
    fee_structure_id: int
    amount_paid: Decimal
    payment_date: date
    payment_method: str
    status: str

# --- EXAMS ---
class ExamScheduleBase(BaseModel):
    subject_id: int
    exam_date: date
    exam_time: str
    duration_minutes: int
    exam_type: str

class ExamResultBase(BaseModel):
    student_id: int
    exam_schedule_id: int
    marks_obtained: Decimal
    max_marks: Decimal
    grade: str

# --- ASSIGNMENTS ---
class AssignmentBase(BaseModel):
    subject_id: int
    faculty_id: int
    title: str
    description: str
    due_date: date
    max_marks: Decimal

class AssignmentSubmissionBase(BaseModel):
    assignment_id: int
    student_id: int
    submission_date: datetime
    file_path: str
    marks_obtained: Optional[Decimal] = None
    feedback: Optional[str] = None

# --- LIBRARY ---
class LibraryBookBase(BaseModel):
    title: str
    author: str
    isbn: str
    quantity_available: int
    quantity_total: int
    publication_year: int

class BookIssuanceBase(BaseModel):
    student_id: int
    book_id: int
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    status: str

# --- NOTIFICATIONS & LEAVE ---
class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    is_read: bool = False

class LeaveRequestBase(BaseModel):
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str = "Pending"
