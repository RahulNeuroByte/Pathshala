import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel, EmailStr

from backend.db.session import get_db
from backend.models.models import User, StudentProfile, FacultyProfile, Department, Course
from backend.schemas.schemas import UserOut, UserCreate
from backend.core.security import get_password_hash
from backend.api.v1.endpoints.login import get_current_user
from backend.services.email import send_smtp_email


router = APIRouter()

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None  # format YYYY-MM-DD
    gender: Optional[str] = None
    password: Optional[str] = None
    alternative_phone: Optional[str] = None
    personal_email: Optional[str] = None
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    blood_group: Optional[str] = None

class PasswordReset(BaseModel):
    username: str
    email: str
    new_password: str

@router.get("/", response_model=List[UserOut])
def read_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserOut)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    db_obj = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role_id=user_in.role_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.lower() if current_user.role else "admin"
    
    # Base details
    profile_data = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": role_name,
        "role_id": current_user.role_id,
        "is_active": current_user.is_active,
        "profile_photo": current_user.profile_photo or "",
        "student_id": None,
        "faculty_id": None,
        "first_name": "",
        "last_name": "",
        "phone": "",
        "address": "",
        "dob": "",
        "gender": "",
        "employee_id": "",
        "designation": "",
        "specialization": "",
        "roll_no": "",
        "enrollment_no": "",
        "dept_name": "",
        "course_name": "",
        "current_semester": None,
        "alternative_phone": "",
        "personal_email": "",
        "father_name": "",
        "father_occupation": "",
        "mother_name": "",
        "mother_occupation": "",
        "permanent_address": "",
        "current_address": "",
        "blood_group": "",
        "pathshala_email": "",
        "authorities": {}
    }
    
    if role_name == "student" and current_user.student_profile:
        sp = current_user.student_profile
        profile_data.update({
            "student_id": sp.id,
            "first_name": sp.first_name,
            "last_name": sp.last_name,
            "phone": sp.phone or "",
            "address": sp.address or "",
            "dob": str(sp.dob) if sp.dob else "",
            "gender": sp.gender or "",
            "roll_no": sp.roll_no,
            "enrollment_no": sp.enrollment_no,
            "current_semester": sp.current_semester,
            "dept_id": sp.dept_id,
            "course_id": sp.course_id,
            "section": sp.section or "A",
            "batch": sp.batch or "",
            "personal_email": sp.personal_email or "",
            "pathshala_email": sp.pathshala_email or "",
            "alternative_phone": sp.alternative_phone or "",
            "father_name": sp.father_name or "",
            "father_occupation": sp.father_occupation or "",
            "mother_name": sp.mother_name or "",
            "mother_occupation": sp.mother_occupation or "",
            "permanent_address": sp.permanent_address or "",
            "current_address": sp.current_address or "",
            "blood_group": sp.blood_group or ""
        })
        if sp.dept_id:
            dept = db.query(Department).filter(Department.id == sp.dept_id).first()
            if dept:
                profile_data["dept_name"] = dept.name
        if sp.course_id:
            course = db.query(Course).filter(Course.id == sp.course_id).first()
            if course:
                profile_data["course_name"] = course.name
                
    elif role_name in ["faculty", "hod", "class_counsellor", "principal", "librarian"] and current_user.faculty_profile:
        fp = current_user.faculty_profile
        profile_data.update({
            "faculty_id": fp.id,
            "first_name": fp.first_name,
            "last_name": fp.last_name,
            "employee_id": fp.employee_id,
            "designation": fp.designation or ("HOD" if role_name == "hod" else "Professor"),
            "specialization": fp.specialization or "",
            "dept_id": fp.dept_id,
            "course_id": fp.course_id,
            "section": fp.section,
            "current_semester": fp.current_semester,
            "phone": fp.alternative_phone or "",
            "address": fp.current_address or "",
            "batch": fp.batch or "",
            "personal_email": fp.personal_email or "",
            "pathshala_email": fp.pathshala_email or "",
            "alternative_phone": fp.alternative_phone or "",
            "father_name": fp.father_name or "",
            "father_occupation": fp.father_occupation or "",
            "mother_name": fp.mother_name or "",
            "mother_occupation": fp.mother_occupation or "",
            "permanent_address": fp.permanent_address or "",
            "current_address": fp.current_address or "",
            "blood_group": fp.blood_group or ""
        })
        if fp.dept_id:
            dept = db.query(Department).filter(Department.id == fp.dept_id).first()
            if dept:
                profile_data["dept_name"] = dept.name
        if fp.course_id:
            course = db.query(Course).filter(Course.id == fp.course_id).first()
            if course:
                profile_data["course_name"] = course.name
                
    elif role_name == "admin":
        profile_data.update({
            "first_name": "Admin",
            "last_name": "User",
            "phone": "9999999999",
            "address": "Campus Admin Office",
            "designation": "Super Administrator"
        })
        
    # Resolve authorities for query system
    cc_details = None
    hod_details = None
    principal_details = None
    
    # 1. Resolve Class Counsellor
    if role_name == "student" and current_user.student_profile:
        sp = current_user.student_profile
        cc_prof = db.query(FacultyProfile).join(User).filter(
            User.role_id == 7, # CLASS_COUNSELLOR
            FacultyProfile.course_id == sp.course_id,
            FacultyProfile.current_semester == sp.current_semester,
            FacultyProfile.section == sp.section
        ).first()
        if cc_prof:
            cc_details = {
                "name": f"{cc_prof.first_name} {cc_prof.last_name}",
                "email": cc_prof.pathshala_email or cc_prof.personal_email or cc_prof.user.email,
                "phone": cc_prof.alternative_phone or ""
            }
            
    # 2. Resolve HOD
    dept_id = None
    if role_name == "student" and current_user.student_profile:
        dept_id = current_user.student_profile.dept_id
    elif current_user.faculty_profile:
        dept_id = current_user.faculty_profile.dept_id
        
    if dept_id:
        hod_prof = db.query(FacultyProfile).join(User).filter(
            User.role_id == 2, # HOD
            FacultyProfile.dept_id == dept_id
        ).first()
        if hod_prof:
            hod_details = {
                "name": f"{hod_prof.first_name} {hod_prof.last_name}",
                "email": hod_prof.pathshala_email or hod_prof.personal_email or hod_prof.user.email,
                "phone": hod_prof.alternative_phone or ""
            }
            
    # 3. Resolve Principal
    pr_prof = db.query(FacultyProfile).join(User).filter(
        User.role_id == 5 # PRINCIPAL
    ).first()
    if pr_prof:
        principal_details = {
            "name": f"{pr_prof.first_name} {pr_prof.last_name}",
            "email": pr_prof.pathshala_email or pr_prof.personal_email or pr_prof.user.email,
            "phone": pr_prof.alternative_phone or ""
        }
    else:
        principal_details = {
            "name": "Principal Office",
            "email": "principal@pathshala.edu",
            "phone": "9999999999"
        }
        
    # Fallback chains
    # If no CC details found, fall back to HOD, then Principal
    cc_or_hod_or_pr = cc_details or hod_details or principal_details
    hod_or_pr = hod_details or principal_details
    
    if role_name == "student":
        academic_auth = cc_or_hod_or_pr
        personal_auth = cc_or_hod_or_pr
        marks_auth = cc_or_hod_or_pr
        attendance_auth = cc_or_hod_or_pr
        fees_auth = principal_details
    else:
        academic_auth = hod_or_pr
        personal_auth = hod_or_pr
        marks_auth = hod_or_pr
        attendance_auth = hod_or_pr
        fees_auth = principal_details
        
    profile_data["authorities"] = {
        "personal_info": personal_auth,
        "academic_info": academic_auth,
        "marks": marks_auth,
        "attendance": attendance_auth,
        "fee_payments": fees_auth
    }
        
    return profile_data

@router.put("/me")
def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.email:
        existing_email = db.query(User).filter(User.email == update_data.email, User.id != current_user.id).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered by another account")
        current_user.email = update_data.email
        
    if update_data.password:
        current_user.password_hash = get_password_hash(update_data.password)
        
    role_name = current_user.role.name.lower() if current_user.role else "admin"
    
    if role_name == "student":
        sp = current_user.student_profile
        if not sp:
            sp = StudentProfile(user_id=current_user.id, roll_no=f"ROLL{current_user.id}", enrollment_no=f"ENR{current_user.id}")
            db.add(sp)
            db.flush()
        if update_data.first_name:
            sp.first_name = update_data.first_name
        if update_data.last_name:
            sp.last_name = update_data.last_name
        if update_data.phone is not None:
            sp.phone = update_data.phone
        if update_data.address is not None:
            sp.address = update_data.address
        if update_data.dob:
            try:
                sp.dob = date.fromisoformat(update_data.dob)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid Date of Birth format. Use YYYY-MM-DD")
        if update_data.gender:
            sp.gender = update_data.gender
        if update_data.alternative_phone is not None:
            sp.alternative_phone = update_data.alternative_phone
        if update_data.personal_email is not None:
            sp.personal_email = update_data.personal_email
        if update_data.father_name is not None:
            sp.father_name = update_data.father_name
        if update_data.father_occupation is not None:
            sp.father_occupation = update_data.father_occupation
        if update_data.mother_name is not None:
            sp.mother_name = update_data.mother_name
        if update_data.mother_occupation is not None:
            sp.mother_occupation = update_data.mother_occupation
        if update_data.permanent_address is not None:
            sp.permanent_address = update_data.permanent_address
        if update_data.current_address is not None:
            sp.current_address = update_data.current_address
        if update_data.blood_group is not None:
            sp.blood_group = update_data.blood_group
            
    elif role_name in ["faculty", "hod", "class_counsellor", "librarian", "principal"]:
        fp = current_user.faculty_profile
        if not fp:
            fp = FacultyProfile(user_id=current_user.id, employee_id=f"EMP{current_user.id}")
            db.add(fp)
            db.flush()
        if update_data.first_name:
            fp.first_name = update_data.first_name
        if update_data.last_name:
            fp.last_name = update_data.last_name
        if update_data.phone is not None:
            fp.alternative_phone = update_data.phone
        if update_data.alternative_phone is not None:
            fp.alternative_phone = update_data.alternative_phone
        if update_data.address is not None:
            fp.current_address = update_data.address
        if update_data.personal_email is not None:
            fp.personal_email = update_data.personal_email
        if update_data.father_name is not None:
            fp.father_name = update_data.father_name
        if update_data.father_occupation is not None:
            fp.father_occupation = update_data.father_occupation
        if update_data.mother_name is not None:
            fp.mother_name = update_data.mother_name
        if update_data.mother_occupation is not None:
            fp.mother_occupation = update_data.mother_occupation
        if update_data.permanent_address is not None:
            fp.permanent_address = update_data.permanent_address
        if update_data.current_address is not None:
            fp.current_address = update_data.current_address
        if update_data.blood_group is not None:
            fp.blood_group = update_data.blood_group
            
    db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/reset-password")
def reset_password(
    data: PasswordReset,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == data.username, User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found matching this username and email address"
        )
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/me/photo")
def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Save the file
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}{file_extension}"
    file_path = os.path.join("uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Store the relative URL path
    relative_url = f"/uploads/{filename}"
    current_user.profile_photo = relative_url
    db.commit()
    
    return {"profile_photo": relative_url, "message": "Profile photo uploaded successfully"}

@router.get("/me/notifications")
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from backend.models.models import Notification
    notifications = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    ).order_by(Notification.id.desc()).all()
    
    return notifications

class NotificationCreate(BaseModel):
    title: str
    message: str
    target_role: Optional[str] = None

@router.post("/me/notifications")
def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from backend.models.models import Notification, Role
    # Verify permission (HOD or Admin can broadcast)
    if current_user.role.name not in ["ADMIN", "HOD"]:
        raise HTTPException(status_code=403, detail="Not authorized to post announcements")
        
    if data.target_role:
        role_name = data.target_role.upper()
        target_users = db.query(User).join(Role).filter(Role.name == role_name).all()
        for u in target_users:
            notif = Notification(
                user_id=u.id,
                title=data.title,
                message=data.message
            )
            db.add(notif)
    else:
        notif = Notification(
            user_id=None,
            title=data.title,
            message=data.message
        )
        db.add(notif)
        
    db.commit()
    return {"message": "Notice broadcasted successfully"}

@router.get("/directory")
def get_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    results = []
    for u in users:
        role_name = u.role.name if u.role else "User"
        name = u.username
        email = u.email
        phone = ""
        dept_name = ""
        
        if u.student_profile:
            sp = u.student_profile
            name = f"{sp.first_name} {sp.last_name}"
            email = sp.pathshala_email or sp.personal_email or u.email
            phone = sp.phone or sp.alternative_phone or ""
            if sp.dept_id:
                dept = db.query(Department).filter(Department.id == sp.dept_id).first()
                if dept:
                    dept_name = dept.name
        elif u.faculty_profile:
            fp = u.faculty_profile
            name = f"{fp.first_name} {fp.last_name}"
            email = fp.pathshala_email or fp.personal_email or u.email
            phone = fp.alternative_phone or ""
            if fp.dept_id:
                dept = db.query(Department).filter(Department.id == fp.dept_id).first()
                if dept:
                    dept_name = dept.name
        else:
            name = u.username.capitalize()
            email = u.email
            phone = ""
            
        results.append({
            "id": u.id,
            "username": u.username,
            "name": name,
            "role": role_name,
            "email": email,
            "phone": phone,
            "dept_name": dept_name,
            "profile_photo": u.profile_photo or ""
        })
    return results

class EmailCompose(BaseModel):
    to_email: str
    subject: str
    body: str

@router.post("/send-email")
def send_email(
    data: EmailCompose,
    current_user: User = Depends(get_current_user)
):
    from backend.core.logging_config import logger
    logger.info(f"[EMAIL LOG] Composed by: {current_user.username} ({current_user.email}) | To: {data.to_email} | Subject: {data.subject}")
    
    # Call SMTP helper
    success = send_smtp_email(data.to_email, data.subject, data.body)
    
    if success:
        return {"message": "Email dispatched successfully via SMTP!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email. SMTP credentials might be missing, invalid, or connection failed."
        )


