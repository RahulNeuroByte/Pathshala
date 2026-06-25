from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.models import StudentProfile, User, Department, FacultyProfile, Notification, Course
from backend.schemas.schemas import StudentCreate
from backend.core.security import get_password_hash
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

@router.get("/")
def read_students(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    skip: int = 0, 
    limit: int = 1000
):
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    query = db.query(StudentProfile)
    
    if role_name in ["ADMIN", "PRINCIPAL", "LIBRARIAN"]:
        pass
    elif role_name == "HOD":
        if current_user.faculty_profile and current_user.faculty_profile.dept_id:
            query = query.filter(StudentProfile.dept_id == current_user.faculty_profile.dept_id)
        else:
            return []
    elif role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if fp and fp.course_id and fp.current_semester and fp.section:
            query = query.filter(
                StudentProfile.course_id == fp.course_id,
                StudentProfile.current_semester == fp.current_semester,
                StudentProfile.section == fp.section
            )
        else:
            return []
    elif role_name == "FACULTY":
        if current_user.faculty_profile and current_user.faculty_profile.dept_id:
            query = query.filter(StudentProfile.dept_id == current_user.faculty_profile.dept_id)
        else:
            return []
    else:
        if current_user.student_profile:
            query = query.filter(StudentProfile.id == current_user.student_profile.id)
        else:
            return []
            
    return query.offset(skip).limit(limit).all()

@router.get("/{student_id}")
def read_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Check permissions
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    if role_name in ["ADMIN", "PRINCIPAL", "LIBRARIAN"]:
        return student
    elif role_name == "HOD":
        if current_user.faculty_profile and student.dept_id == current_user.faculty_profile.dept_id:
            return student
    elif role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if fp and student.course_id == fp.course_id and student.current_semester == fp.current_semester and student.section == fp.section:
            return student
    elif role_name == "FACULTY":
        if current_user.faculty_profile and student.dept_id == current_user.faculty_profile.dept_id:
            return student
    else:
        if current_user.student_profile and student.id == current_user.student_profile.id:
            return student
            
    raise HTTPException(status_code=403, detail="Not authorized to view this student profile")

@router.post("/")
def create_student(
    student_in: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce create permissions
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD", "CLASS_COUNSELLOR"]:
        raise HTTPException(status_code=403, detail="Not authorized to enroll students")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or student_in.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only enroll students in their own department")
            
    elif role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if not fp or student_in.course_id != fp.course_id or student_in.current_semester != fp.current_semester or student_in.section != fp.section:
            raise HTTPException(status_code=403, detail="Class Counsellor can only enroll students in their assigned section")
            
    dept = db.query(Department).filter(Department.id == student_in.dept_id).first()
    dept_code = dept.code if dept else "cse"
    pathshala_email = f"{student_in.roll_no}.{dept_code}@pathshala.edu.in"

    existing_user = db.query(User).filter((User.username == student_in.username) | (User.email == pathshala_email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User username or enrollment roll_no already exists")
    
    # Create User
    db_user = User(
        username=student_in.username,
        email=pathshala_email,
        password_hash=get_password_hash(student_in.password),
        role_id=4, # STUDENT
        is_active=True
    )
    db.add(db_user)
    db.flush()
    
    # Create Student Profile
    db_profile = StudentProfile(
        user_id=db_user.id,
        roll_no=student_in.roll_no,
        enrollment_no=student_in.enrollment_no,
        first_name=student_in.first_name,
        last_name=student_in.last_name,
        dept_id=student_in.dept_id,
        course_id=student_in.course_id,
        current_semester=student_in.current_semester or 1,
        batch=student_in.batch,
        personal_email=student_in.personal_email,
        pathshala_email=pathshala_email,
        alternative_phone=student_in.alternative_phone,
        father_name=student_in.father_name,
        father_occupation=student_in.father_occupation,
        mother_name=student_in.mother_name,
        mother_occupation=student_in.mother_occupation,
        permanent_address=student_in.permanent_address,
        current_address=student_in.current_address,
        blood_group=student_in.blood_group,
        section=student_in.section or "A"
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    # Real Email Dispatch
    email_dest = student_in.personal_email or pathshala_email
    try:
        from backend.services.email import send_smtp_email
        from backend.services.email_templates import get_credentials_email_html
        
        subj = "Welcome to Pathshala ERP - Student Credentials"
        body = f"Hello {student_in.first_name},\nYour account has been created. Username: {student_in.username}, Password: {student_in.password}"
        html_body = get_credentials_email_html(
            name=f"{student_in.first_name} {student_in.last_name}",
            role_name="Student",
            username=student_in.username,
            password=student_in.password,
            pathshala_email=pathshala_email
        )
        send_smtp_email(email_dest, subj, body, html_body=html_body)
    except Exception as e:
        from backend.core.logging_config import logger
        logger.error(f"[STUDENTS] Failed to dispatch credentials email: {e}", exc_info=True)
    
    return db_profile

@router.put("/{student_id}")
def update_student(
    student_id: int, 
    student_in: dict, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    # Enforce edit boundaries
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD", "CLASS_COUNSELLOR"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit student profiles")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or db_profile.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only edit students in their own department")
            
    elif role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if not fp or db_profile.course_id != fp.course_id or db_profile.current_semester != fp.current_semester or db_profile.section != fp.section:
            raise HTTPException(status_code=403, detail="Class Counsellor can only edit students in their assigned section")
    
    # Apply changes
    for key, value in student_in.items():
        if hasattr(db_profile, key) and key not in ['id', 'user_id', 'roll_no', 'enrollment_no']:
            setattr(db_profile, key, value)
            
    db.commit()
    db.refresh(db_profile)
    
    # Send cross-role notifications
    if role_name == "CLASS_COUNSELLOR":
        # Notify department HOD
        hod_user = db.query(User).join(FacultyProfile).filter(
            User.role_id == 2,  # HOD
            FacultyProfile.dept_id == db_profile.dept_id
        ).first()
        if hod_user:
            notif = Notification(
                user_id=hod_user.id,
                title="Student Profile Modified by CC",
                message=f"Class Counsellor {current_user.faculty_profile.first_name} {current_user.faculty_profile.last_name} modified details of student {db_profile.first_name} {db_profile.last_name} (Roll: {db_profile.roll_no})."
            )
            db.add(notif)
            db.commit()
            
    elif role_name == "HOD":
        # Notify Principal
        principal_user = db.query(User).filter(User.role_id == 5).first()  # PRINCIPAL
        if principal_user:
            notif = Notification(
                user_id=principal_user.id,
                title="Student Profile Modified by HOD",
                message=f"HOD {current_user.faculty_profile.first_name} {current_user.faculty_profile.last_name} modified details of student {db_profile.first_name} {db_profile.last_name} (Roll: {db_profile.roll_no})."
            )
            db.add(notif)
            db.commit()
            
    return db_profile

@router.delete("/{student_id}")
def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    # Enforce delete boundaries
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD", "CLASS_COUNSELLOR"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete student profiles")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or db_profile.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only delete students in their own department")
            
    elif role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if not fp or db_profile.course_id != fp.course_id or db_profile.current_semester != fp.current_semester or db_profile.section != fp.section:
            raise HTTPException(status_code=403, detail="Class Counsellor can only delete students in their assigned section")
            
    user = db_profile.user
    
    # Delete related transactions first to prevent foreign key errors
    from backend.models.models import Attendance, BookIssuance, ExamResult, AssignmentSubmission, FeePayment
    db.query(Attendance).filter(Attendance.student_id == student_id).delete()
    db.query(BookIssuance).filter(BookIssuance.student_id == student_id).delete()
    db.query(ExamResult).filter(ExamResult.student_id == student_id).delete()
    db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student_id).delete()
    db.query(FeePayment).filter(FeePayment.student_id == student_id).delete()
    
    db.delete(db_profile)
    if user:
        # Delete user notifications
        db.query(Notification).filter(Notification.user_id == user.id).delete()
        db.delete(user)
        
    db.commit()
    
    # Notify Principal if deleted by HOD
    if role_name == "HOD":
        principal_user = db.query(User).filter(User.role_id == 5).first()
        if principal_user:
            notif = Notification(
                user_id=principal_user.id,
                title="Student Profile Removed by HOD",
                message=f"HOD {current_user.faculty_profile.first_name} {current_user.faculty_profile.last_name} removed student {db_profile.first_name} {db_profile.last_name} (Roll: {db_profile.roll_no}) from the database."
            )
            db.add(notif)
            db.commit()
            
    return {"message": "Student profile and credentials deleted successfully"}
