from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from backend.db.session import get_db
from backend.models.models import User, FacultyProfile, Department, ChatMessage, Feedback, Role
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

# --- Pydantic Schemas ---
class ChatMessageOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_role: str
    room_type: str
    dept_id: Optional[int]
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    room_type: str
    message: str
    dept_id: Optional[int] = None

class FeedbackOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_role: str
    receiver_id: Optional[int]
    receiver_name: Optional[str]
    dept_id: Optional[int]
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    receiver_id: Optional[int] = None
    message: str

class ProfileSummaryOut(BaseModel):
    user_id: int
    name: str
    role: str
    email: str
    phone: str
    dept_name: str
    designation: str


# --- Endpoints ---

@router.get("/hods", response_model=List[ProfileSummaryOut])
def get_all_hods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Principal or Admin can get all HODs list
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    if role_name not in ["PRINCIPAL", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Principal or Admin can query HOD directory")
        
    hods = db.query(FacultyProfile).join(User).filter(User.role_id == 2).all()
    results = []
    for h in hods:
        dept = db.query(Department).filter(Department.id == h.dept_id).first()
        results.append(ProfileSummaryOut(
            user_id=h.user_id,
            name=f"{h.first_name} {h.last_name}",
            role="HOD",
            email=h.pathshala_email or h.personal_email or h.user.email,
            phone=h.alternative_phone or "",
            dept_name=dept.name if dept else "N/A",
            designation=h.designation or "HOD"
        ))
    return results


@router.get("/department-teachers", response_model=List[ProfileSummaryOut])
def get_department_teachers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    if role_name != "HOD" or not current_user.faculty_profile:
        raise HTTPException(status_code=403, detail="Only department HOD can query department teachers")
        
    dept_id = current_user.faculty_profile.dept_id
    if not dept_id:
        return []
        
    # Get all faculty/teachers in same department (exclude HOD themselves)
    teachers = db.query(FacultyProfile).join(User).filter(
        FacultyProfile.dept_id == dept_id,
        User.id != current_user.id
    ).all()
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    dept_name = dept.name if dept else "N/A"
    
    results = []
    for t in teachers:
        role_label = "Class Counsellor" if t.user.role_id == 7 else "Faculty"
        results.append(ProfileSummaryOut(
            user_id=t.user_id,
            name=f"{t.first_name} {t.last_name}",
            role=role_label,
            email=t.pathshala_email or t.personal_email or t.user.email,
            phone=t.alternative_phone or "",
            dept_name=dept_name,
            designation=t.designation or "Professor"
        ))
    return results


@router.get("/chat", response_model=List[ChatMessageOut])
def get_chat_messages(
    room_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    
    query = db.query(ChatMessage)
    
    if room_type == "PRINCIPAL_HOD":
        # Accessible by Principal and HODs
        if role_name not in ["PRINCIPAL", "HOD", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Not authorized to access Principal-HOD chat room")
        query = query.filter(ChatMessage.room_type == "PRINCIPAL_HOD")
        
    elif room_type == "DEPT_FACULTY":
        # Accessible by HOD and Faculty of their department
        if role_name not in ["HOD", "FACULTY", "CLASS_COUNSELLOR"]:
            raise HTTPException(status_code=403, detail="Not authorized to access Department room")
            
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="User has no faculty profile associated")
            
        dept_id = current_user.faculty_profile.dept_id
        if not dept_id:
            return []
            
        query = query.filter(
            ChatMessage.room_type == "DEPT_FACULTY",
            ChatMessage.dept_id == dept_id
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid room type")
        
    # Return last 100 messages ordered by id ascending
    messages = query.order_by(ChatMessage.id.desc()).limit(100).all()
    messages.reverse()
    
    results = []
    for msg in messages:
        sender_role = msg.sender.role.name if msg.sender.role else "User"
        sender_profile = msg.sender.faculty_profile
        sender_name = f"{sender_profile.first_name} {sender_profile.last_name}" if sender_profile else msg.sender.username.capitalize()
        
        results.append(ChatMessageOut(
            id=msg.id,
            sender_id=msg.sender_id,
            sender_name=sender_name,
            sender_role=sender_role,
            room_type=msg.room_type,
            dept_id=msg.dept_id,
            message=msg.message,
            created_at=msg.created_at
        ))
    return results


@router.post("/chat", response_model=ChatMessageOut)
def send_chat_message(
    chat_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    
    dept_id = None
    if chat_in.room_type == "PRINCIPAL_HOD":
        if role_name not in ["PRINCIPAL", "HOD"]:
            raise HTTPException(status_code=403, detail="Not authorized to post in HOD Chat")
    elif chat_in.room_type == "DEPT_FACULTY":
        if role_name not in ["HOD", "FACULTY", "CLASS_COUNSELLOR"]:
            raise HTTPException(status_code=403, detail="Not authorized to post in Department chat")
        if not current_user.faculty_profile:
            raise HTTPException(status_code=400, detail="User has no faculty profile associated")
        dept_id = current_user.faculty_profile.dept_id
    else:
        raise HTTPException(status_code=400, detail="Invalid room type")
        
    db_msg = ChatMessage(
        sender_id=current_user.id,
        room_type=chat_in.room_type,
        dept_id=dept_id,
        message=chat_in.message
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    
    sender_profile = current_user.faculty_profile
    sender_name = f"{sender_profile.first_name} {sender_profile.last_name}" if sender_profile else current_user.username.capitalize()
    
    return ChatMessageOut(
        id=db_msg.id,
        sender_id=db_msg.sender_id,
        sender_name=sender_name,
        sender_role=role_name,
        room_type=db_msg.room_type,
        dept_id=db_msg.dept_id,
        message=db_msg.message,
        created_at=db_msg.created_at
    )


@router.get("/feedback", response_model=List[FeedbackOut])
def get_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    
    if not current_user.faculty_profile:
        raise HTTPException(status_code=400, detail="Only faculty and staff can interact with feedback system")
        
    dept_id = current_user.faculty_profile.dept_id
    if not dept_id:
        return []
        
    query = db.query(Feedback)
    
    if role_name == "HOD":
        # HOD can view all feedback inside their department
        query = query.filter(Feedback.dept_id == dept_id)
    else:
        # Teachers see feedback they either sent or received
        query = query.filter(
            (Feedback.sender_id == current_user.id) | (Feedback.receiver_id == current_user.id)
        )
        
    feedbacks = query.order_by(Feedback.id.desc()).all()
    results = []
    for f in feedbacks:
        sender_role = f.sender.role.name if f.sender.role else "User"
        sender_prof = f.sender.faculty_profile
        sender_name = f"{sender_prof.first_name} {sender_prof.last_name}" if sender_prof else f.sender.username.capitalize()
        
        receiver_name = None
        if f.receiver:
            rec_prof = f.receiver.faculty_profile
            receiver_name = f"{rec_prof.first_name} {rec_prof.last_name}" if rec_prof else f.receiver.username.capitalize()
            
        results.append(FeedbackOut(
            id=f.id,
            sender_id=f.sender_id,
            sender_name=sender_name,
            sender_role=sender_role,
            receiver_id=f.receiver_id,
            receiver_name=receiver_name,
            dept_id=f.dept_id,
            message=f.message,
            created_at=f.created_at
        ))
    return results


@router.post("/feedback", response_model=FeedbackOut)
def send_feedback(
    feedback_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    
    if not current_user.faculty_profile:
        raise HTTPException(status_code=400, detail="User has no faculty profile associated")
        
    dept_id = current_user.faculty_profile.dept_id
    if not dept_id:
         raise HTTPException(status_code=400, detail="User has no department associated")
         
    receiver_id = feedback_in.receiver_id
    
    # If faculty sends feedback, target HOD by default if not specified
    if role_name != "HOD" and not receiver_id:
        hod_user = db.query(User).join(FacultyProfile).filter(
            User.role_id == 2, # HOD
            FacultyProfile.dept_id == dept_id
        ).first()
        if hod_user:
            receiver_id = hod_user.id
            
    db_feedback = Feedback(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        dept_id=dept_id,
        message=feedback_in.message
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    sender_prof = current_user.faculty_profile
    sender_name = f"{sender_prof.first_name} {sender_prof.last_name}" if sender_prof else current_user.username.capitalize()
    
    receiver_name = None
    if db_feedback.receiver:
        rec_prof = db_feedback.receiver.faculty_profile
        receiver_name = f"{rec_prof.first_name} {rec_prof.last_name}" if rec_prof else db_feedback.receiver.username.capitalize()
        
    return FeedbackOut(
        id=db_feedback.id,
        sender_id=db_feedback.sender_id,
        sender_name=sender_name,
        sender_role=role_name,
        receiver_id=db_feedback.receiver_id,
        receiver_name=receiver_name,
        dept_id=db_feedback.dept_id,
        message=db_feedback.message,
        created_at=db_feedback.created_at
    )
