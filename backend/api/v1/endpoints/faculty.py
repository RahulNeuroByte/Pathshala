from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.models import FacultyProfile, User, Department, Notification
from backend.schemas.schemas import FacultyCreate
from backend.core.security import get_password_hash
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

@router.get("/")
def read_faculty(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    skip: int = 0, 
    limit: int = 100
):
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    query = db.query(FacultyProfile)
    
    if role_name in ["ADMIN", "PRINCIPAL", "LIBRARIAN"]:
        pass
    elif role_name == "HOD":
        if current_user.faculty_profile and current_user.faculty_profile.dept_id:
            query = query.filter(FacultyProfile.dept_id == current_user.faculty_profile.dept_id)
        else:
            return []
    else:
        # Regular faculty, CC, and students see department faculty profiles
        if current_user.faculty_profile and current_user.faculty_profile.dept_id:
            query = query.filter(FacultyProfile.dept_id == current_user.faculty_profile.dept_id)
        elif current_user.student_profile and current_user.student_profile.dept_id:
            query = query.filter(FacultyProfile.dept_id == current_user.student_profile.dept_id)
        else:
            return []
            
    return query.offset(skip).limit(limit).all()

@router.get("/{faculty_id}")
def read_faculty_member(
    faculty_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    faculty = db.query(FacultyProfile).filter(FacultyProfile.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
        
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    if role_name in ["ADMIN", "PRINCIPAL", "LIBRARIAN"]:
        return faculty
    elif role_name == "HOD":
        if current_user.faculty_profile and faculty.dept_id == current_user.faculty_profile.dept_id:
            return faculty
    else:
        # Check if same department
        if current_user.faculty_profile and faculty.dept_id == current_user.faculty_profile.dept_id:
            return faculty
        elif current_user.student_profile and faculty.dept_id == current_user.student_profile.dept_id:
            return faculty
            
    raise HTTPException(status_code=403, detail="Not authorized to view this faculty profile")

@router.post("/")
def create_faculty(
    faculty_in: FacultyCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD"]:
        raise HTTPException(status_code=403, detail="Not authorized to create faculty profiles")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or faculty_in.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only create faculty in their own department")
        des_upper = (faculty_in.designation or "").upper()
        if des_upper in ["HOD", "LIBRARIAN", "PRINCIPAL"]:
            raise HTTPException(status_code=403, detail="HOD is not authorized to create HOD, Librarian or Principal profiles")
            
    dept = db.query(Department).filter(Department.id == faculty_in.dept_id).first()
    dept_code = dept.code if dept else "cse"
    pathshala_email = f"{faculty_in.employee_id.lower()}.{dept_code}@pathshala.edu.in"

    existing_user = db.query(User).filter((User.username == faculty_in.username) | (User.email == pathshala_email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User username or employee_id already exists")
        
    role_id = 3 # FACULTY
    designation = faculty_in.designation or "Professor"
    des_up = designation.upper()
    if des_up == "HOD":
        role_id = 2
    elif des_up in ["CLASS COUNSELLOR", "CC"]:
        role_id = 7
        designation = "Class Counsellor"
    elif des_up == "LIBRARIAN":
        role_id = 6
        designation = "Librarian"
    elif des_up == "PRINCIPAL":
        role_id = 5
        designation = "Principal"
        
    db_user = User(
        username=faculty_in.username,
        email=pathshala_email,
        password_hash=get_password_hash(faculty_in.password),
        role_id=role_id,
        is_active=True
    )
    db.add(db_user)
    db.flush()
    
    db_profile = FacultyProfile(
        user_id=db_user.id,
        employee_id=faculty_in.employee_id,
        first_name=faculty_in.first_name,
        last_name=faculty_in.last_name,
        designation=designation,
        dept_id=faculty_in.dept_id,
        specialization=faculty_in.specialization,
        batch=faculty_in.batch,
        personal_email=faculty_in.personal_email,
        pathshala_email=pathshala_email,
        alternative_phone=faculty_in.alternative_phone,
        father_name=faculty_in.father_name,
        father_occupation=faculty_in.father_occupation,
        mother_name=faculty_in.mother_name,
        mother_occupation=faculty_in.mother_occupation,
        permanent_address=faculty_in.permanent_address,
        current_address=faculty_in.current_address,
        blood_group=faculty_in.blood_group,
        section=faculty_in.section,
        course_id=faculty_in.course_id,
        current_semester=faculty_in.current_semester
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    # Real Email Dispatch
    email_dest = faculty_in.personal_email or pathshala_email
    try:
        from backend.services.email import send_smtp_email
        from backend.services.email_templates import get_credentials_email_html
        
        subj = "Welcome to Pathshala ERP - Faculty Credentials"
        body = f"Hello {faculty_in.first_name},\nYour staff account has been created. Username: {faculty_in.username}, Password: {faculty_in.password}"
        html_body = get_credentials_email_html(
            name=f"{faculty_in.first_name} {faculty_in.last_name}",
            role_name=designation,
            username=faculty_in.username,
            password=faculty_in.password,
            pathshala_email=pathshala_email
        )
        send_smtp_email(email_dest, subj, body, html_body=html_body)
    except Exception as e:
        from backend.core.logging_config import logger
        logger.error(f"[FACULTY] Failed to dispatch credentials email: {e}", exc_info=True)
    
    return db_profile

@router.put("/{faculty_id}")
def update_faculty(
    faculty_id: int, 
    faculty_in: dict, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_profile = db.query(FacultyProfile).filter(FacultyProfile.id == faculty_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit faculty profiles")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or db_profile.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only edit faculty in their own department")
        if db_profile.user and db_profile.user.role_id in [2, 5, 6]: # HOD, PRINCIPAL, LIBRARIAN
            raise HTTPException(status_code=403, detail="HOD is not authorized to modify details of HOD, Librarian or Principal profiles")
        if 'designation' in faculty_in:
            des_upper = faculty_in['designation'].upper()
            if des_upper in ["HOD", "LIBRARIAN", "PRINCIPAL"]:
                raise HTTPException(status_code=403, detail="HOD is not authorized to assign HOD, Librarian or Principal roles")
            
    for key, value in faculty_in.items():
        if hasattr(db_profile, key) and key not in ['id', 'user_id', 'employee_id']:
            setattr(db_profile, key, value)
            
    if 'designation' in faculty_in and db_profile.user:
        des = faculty_in['designation'].upper()
        if des == "HOD":
            db_profile.user.role_id = 2
        elif des in ["CLASS COUNSELLOR", "CC"]:
            db_profile.user.role_id = 7
        elif des == "LIBRARIAN":
            db_profile.user.role_id = 6
        elif des == "PRINCIPAL":
            db_profile.user.role_id = 5
        elif des in ["PROFESSOR", "ASSOCIATE PROFESSOR", "ASSISTANT PROFESSOR"]:
            db_profile.user.role_id = 3
            
    db.commit()
    db.refresh(db_profile)
    
    # If HOD made the modification, notify the Principal
    if role_name == "HOD":
        principal_user = db.query(User).filter(User.role_id == 5).first()
        if principal_user:
            notif = Notification(
                user_id=principal_user.id,
                title="Faculty Profile Updated by HOD",
                message=f"HOD {current_user.faculty_profile.first_name} {current_user.faculty_profile.last_name} updated faculty member {db_profile.first_name} {db_profile.last_name} (ID: {db_profile.employee_id}) details/designation."
            )
            db.add(notif)
            db.commit()
            
    return db_profile

@router.delete("/{faculty_id}")
def delete_faculty(
    faculty_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_profile = db.query(FacultyProfile).filter(FacultyProfile.id == faculty_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
        
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    if role_name not in ["ADMIN", "PRINCIPAL", "HOD"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete faculty profiles")
        
    if role_name == "HOD":
        if not current_user.faculty_profile or db_profile.dept_id != current_user.faculty_profile.dept_id:
            raise HTTPException(status_code=403, detail="HOD can only delete faculty in their own department")
        if db_profile.user and db_profile.user.role_id in [2, 5, 6]: # HOD, PRINCIPAL, LIBRARIAN
            raise HTTPException(status_code=403, detail="HOD is not authorized to delete HOD, Librarian or Principal profiles")
            
    user = db_profile.user
    
    # Delete related dependencies
    from backend.models.models import Attendance, BookIssuance, Assignment
    db.query(Attendance).filter(Attendance.faculty_id == faculty_id).delete()
    db.query(BookIssuance).filter(BookIssuance.faculty_id == faculty_id).delete()
    # Nullify or delete assignments
    db.query(Assignment).filter(Assignment.faculty_id == faculty_id).delete()
    
    db.delete(db_profile)
    if user:
        db.query(Notification).filter(Notification.user_id == user.id).delete()
        db.delete(user)
    db.commit()
    
    # Notify Principal if deleted by HOD
    if role_name == "HOD":
        principal_user = db.query(User).filter(User.role_id == 5).first()
        if principal_user:
            notif = Notification(
                user_id=principal_user.id,
                title="Faculty Profile Removed by HOD",
                message=f"HOD {current_user.faculty_profile.first_name} {current_user.faculty_profile.last_name} removed faculty member {db_profile.first_name} {db_profile.last_name} (ID: {db_profile.employee_id}) from the system."
            )
            db.add(notif)
            db.commit()
            
    return {"message": "Faculty profile deleted successfully"}

@router.post("/{faculty_id}/make-hod")
def make_hod(
    faculty_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else "STUDENT"
    
    if role_name not in ["ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only Admin or Principal can promote a HOD")
        
    fp = db.query(FacultyProfile).filter(FacultyProfile.id == faculty_id).first()
    if not fp:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    
    user = fp.user
    if not user:
        raise HTTPException(status_code=404, detail="User not found for this faculty profile")
        
    user.role_id = 2 # HOD
    fp.designation = "HOD"
    db.commit()
    return {"message": "Faculty member promoted to HOD successfully"}
