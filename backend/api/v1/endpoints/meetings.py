from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel
from backend.db.session import get_db
from backend.models.models import Meeting, User
from backend.schemas.schemas import MeetingOut
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_date: date
    meeting_time: str
    target_role: Optional[str] = None

@router.get("/", response_model=List[MeetingOut])
def get_meetings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role_name = current_user.role.name.upper() if current_user.role else "ADMIN"
    if role_name == "STUDENT":
        return db.query(Meeting).filter(
            (Meeting.target_role == "STUDENT") | (Meeting.target_role == None)
        ).all()
    elif role_name in ["FACULTY", "HOD", "PRINCIPAL", "LIBRARIAN", "CLASS_COUNSELLOR"]:
        return db.query(Meeting).filter(
            (Meeting.target_role == role_name) | 
            (Meeting.target_role == "STAFF") | 
            (Meeting.target_role == None)
        ).all()
    return db.query(Meeting).all()

@router.post("/", response_model=MeetingOut)
def create_meeting(meeting_in: MeetingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [1, 2, 5]:
        raise HTTPException(status_code=403, detail="Not authorized to schedule meetings")
        
    db_meeting = Meeting(
        title=meeting_in.title,
        description=meeting_in.description,
        meeting_date=meeting_in.meeting_date,
        meeting_time=meeting_in.meeting_time,
        host_id=current_user.id,
        target_role=meeting_in.target_role
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting
