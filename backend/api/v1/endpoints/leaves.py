from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel

from backend.db.session import get_db
from backend.models.models import LeaveRequest, User, StudentProfile, FacultyProfile
from backend.api.v1.endpoints.login import get_current_user
from backend.services.email import send_smtp_email

router = APIRouter()

class LeaveApplyRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str

class LeaveRequestOut(BaseModel):
    id: int
    user_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    applicant_name: str
    applicant_role: str

    class Config:
        from_attributes = True

def get_profile_info(user: User):
    if user.role_id == 4 and user.student_profile:
        return f"{user.student_profile.first_name} {user.student_profile.last_name}", "Student"
    elif user.faculty_profile:
        return f"{user.faculty_profile.first_name} {user.faculty_profile.last_name}", user.faculty_profile.designation or "Faculty"
    return user.username, user.role.name if user.role else "User"

@router.post("/apply")
def apply_leave(leave_in: LeaveApplyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = LeaveRequest(
        user_id=current_user.id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        reason=leave_in.reason,
        status="Pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave

@router.get("/my")
def get_my_leaves(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.user_id == current_user.id).order_by(LeaveRequest.created_at.desc()).all()
    results = []
    name, role_name = get_profile_info(current_user)
    for l in leaves:
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "applicant_name": name,
            "applicant_role": role_name
        })
    return results

@router.get("/pending")
def get_pending_leaves(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    user_ids = []

    if role_name == "CLASS_COUNSELLOR":
        fp = current_user.faculty_profile
        if fp and fp.course_id and fp.current_semester and fp.section:
            students = db.query(StudentProfile).filter(
                StudentProfile.course_id == fp.course_id,
                StudentProfile.current_semester == fp.current_semester,
                StudentProfile.section == fp.section
            ).all()
            user_ids = [s.user_id for s in students]
            
    elif role_name == "HOD":
        # HOD leaves/approvals: If faculty and CC apply directly to Principal, HOD leaves list is empty or can be fallback.
        # But to be safe, HOD can see department faculty leaves, though the main approval is Principal.
        # Let's keep it empty or return departmental ones. Let's return empty to ensure only Principal approves.
        user_ids = []
            
    elif role_name == "PRINCIPAL":
        # HOD (2), Faculty (3), Librarian (6), Class Counsellor (7) leaves all go to Principal
        users = db.query(User).filter(User.role_id.in_([2, 3, 6, 7])).all()
        user_ids = [u.id for u in users]
        
    elif role_name == "ADMIN":
        users = db.query(User).filter(User.role_id == 5).all() # Principal
        user_ids = [u.id for u in users]

    if not user_ids:
        return []

    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.user_id.in_(user_ids),
        LeaveRequest.status == "Pending"
    ).all()

    results = []
    for l in leaves:
        applicant = db.query(User).filter(User.id == l.user_id).first()
        app_name, app_role = get_profile_info(applicant) if applicant else ("Unknown", "User")
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "applicant_name": app_name,
            "applicant_role": app_role
        })
    return results

@router.put("/{leave_id}/approve")
def approve_leave(leave_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    leave.status = "Approved"
    db.commit()
    db.refresh(leave)

    # Trigger SMTP email sending
    applicant = db.query(User).filter(User.id == leave.user_id).first()
    if applicant:
        personal_email = applicant.email
        first_name = applicant.username
        if applicant.role_id == 4 and applicant.student_profile:
            personal_email = applicant.student_profile.personal_email or applicant.email
            first_name = applicant.student_profile.first_name
        elif applicant.faculty_profile:
            personal_email = applicant.faculty_profile.personal_email or applicant.email
            first_name = applicant.faculty_profile.first_name

        body = f"Hello {first_name},\n\nYour leave request for {leave.leave_type} from {leave.start_date} to {leave.end_date} has been APPROVED.\n\nBest regards,\nPathshala ERP Administration"
        from backend.services.email_templates import get_leave_email_html
        html_body = get_leave_email_html(first_name, leave.leave_type, str(leave.start_date), str(leave.end_date), "Approved", leave.reason)
        send_smtp_email(personal_email, "Leave Request Approved", body, html_body=html_body)

    return leave

@router.put("/{leave_id}/reject")
def reject_leave(leave_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    leave.status = "Rejected"
    db.commit()
    db.refresh(leave)

    # Trigger SMTP email sending on rejection as well
    applicant = db.query(User).filter(User.id == leave.user_id).first()
    if applicant:
        personal_email = applicant.email
        first_name = applicant.username
        if applicant.role_id == 4 and applicant.student_profile:
            personal_email = applicant.student_profile.personal_email or applicant.email
            first_name = applicant.student_profile.first_name
        elif applicant.faculty_profile:
            personal_email = applicant.faculty_profile.personal_email or applicant.email
            first_name = applicant.faculty_profile.first_name

        body = f"Hello {first_name},\n\nYour leave request for {leave.leave_type} from {leave.start_date} to {leave.end_date} has been CANCELLED/REJECTED.\n\nBest regards,\nPathshala ERP Administration"
        from backend.services.email_templates import get_leave_email_html
        html_body = get_leave_email_html(first_name, leave.leave_type, str(leave.start_date), str(leave.end_date), "Rejected", leave.reason)
        send_smtp_email(personal_email, "Leave Request Cancelled", body, html_body=html_body)

    return leave


