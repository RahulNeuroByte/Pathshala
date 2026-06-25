from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel

from backend.db.session import get_db
from backend.models.models import Attendance, StaffAttendance, StudentProfile, FacultyProfile, Subject, Course, User
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

class StudentAttendanceItem(BaseModel):
    student_id: int
    status: str # "Present", "Absent", "Late"

class StudentAttendanceMarkRequest(BaseModel):
    subject_id: int
    date: date
    students: List[StudentAttendanceItem]

class StaffMarkAttendanceRequest(BaseModel):
    date: date

@router.post("/student")
def mark_student_attendance(
    data: StudentAttendanceMarkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify permission (only Faculty or Class Counsellor)
    if current_user.role.name not in ["FACULTY", "CLASS_COUNSELLOR", "HOD", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to mark student attendance")
        
    # Check if date is a weekend
    if data.date.weekday() in [5, 6]:
        raise HTTPException(status_code=400, detail="Cannot mark attendance on Saturday or Sunday weekend holidays")

    faculty_id = current_user.faculty_profile.id if current_user.faculty_profile else None

    for item in data.students:
        # Check if record already exists
        record = db.query(Attendance).filter(
            Attendance.student_id == item.student_id,
            Attendance.subject_id == data.subject_id,
            Attendance.date == data.date
        ).first()

        if record:
            record.status = item.status
            if faculty_id:
                record.faculty_id = faculty_id
        else:
            new_record = Attendance(
                student_id=item.student_id,
                subject_id=data.subject_id,
                faculty_id=faculty_id,
                date=data.date,
                status=item.status
            )
            db.add(new_record)

    db.commit()
    return {"message": "Student attendance logged successfully"}

@router.get("/student/my")
def get_my_student_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.name != "STUDENT" or not current_user.student_profile:
        raise HTTPException(status_code=400, detail="Not a student user profile")

    student_id = current_user.student_profile.id
    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()

    # Get all subjects for student course to show 0% if no class marked
    course_id = current_user.student_profile.course_id
    subjects = db.query(Subject).filter(Subject.course_id == course_id).all()
    subject_map = {s.id: s for s in subjects}

    # Group records by subject
    grouped = {}
    for r in records:
        if r.subject_id not in grouped:
            grouped[r.subject_id] = {"attended": 0, "total": 0}
        grouped[r.subject_id]["total"] += 1
        if r.status in ["Present", "Late"]:
            grouped[r.subject_id]["attended"] += 1

    summary = []
    total_attended = 0
    total_classes = 0

    for sub_id, sub in subject_map.items():
        stats = grouped.get(sub_id, {"attended": 0, "total": 0})
        attended = stats["attended"]
        total = stats["total"]
        pct = round((attended / total) * 100, 1) if total > 0 else 100.0 # Default to 100% if no class held
        summary.append({
            "subject": sub.name,
            "code": sub.code,
            "attended": attended,
            "total": total,
            "percentage": pct
        })
        total_attended += attended
        total_classes += total

    overall_percentage = round((total_attended / total_classes) * 100, 1) if total_classes > 0 else 100.0

    # Build daily logs list
    attendance_logs = []
    for r in records:
        sub = subject_map.get(r.subject_id)
        attendance_logs.append({
            "id": r.id,
            "date": str(r.date),
            "subject": sub.name if sub else "Unknown Subject",
            "code": sub.code if sub else "",
            "status": r.status
        })

    return {
        "summary": summary,
        "overall_percentage": overall_percentage,
        "attendance_logs": attendance_logs
    }

@router.post("/staff/mark")
def mark_staff_attendance(
    data: StaffMarkAttendanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.faculty_profile:
        raise HTTPException(status_code=400, detail="Only faculty and staff members can mark staff attendance")

    # Check if date is a weekend
    if data.date.weekday() in [5, 6]:
        raise HTTPException(status_code=400, detail="Cannot mark attendance on Saturday or Sunday weekend holidays")

    faculty_id = current_user.faculty_profile.id

    # Check if request already exists for this date
    existing = db.query(StaffAttendance).filter(
        StaffAttendance.faculty_id == faculty_id,
        StaffAttendance.date == data.date
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Attendance request already submitted for this date")

    # Principal automatically marks as Present without approval, others mark as Pending
    initial_status = "Present" if current_user.role.name == "PRINCIPAL" else "Pending"

    record = StaffAttendance(
        faculty_id=faculty_id,
        date=data.date,
        status=initial_status
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/staff/my")
def get_my_staff_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.faculty_profile:
        raise HTTPException(status_code=400, detail="No faculty profile found")

    faculty_id = current_user.faculty_profile.id
    records = db.query(StaffAttendance).filter(
        StaffAttendance.faculty_id == faculty_id
    ).order_by(StaffAttendance.date.desc()).all()

    results = []
    for r in records:
        results.append({
            "id": r.id,
            "date": str(r.date),
            "status": r.status
        })
    return results

@router.get("/staff/pending")
def get_pending_staff_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.name != "PRINCIPAL":
        raise HTTPException(status_code=403, detail="Only Principal can manage staff attendance approvals")

    pending = db.query(StaffAttendance).filter(StaffAttendance.status == "Pending").all()
    results = []
    for p in pending:
        fp = p.faculty_profile
        name = f"{fp.first_name} {fp.last_name}" if fp else "Unknown Staff"
        emp_id = fp.employee_id if fp else ""
        role_label = fp.designation or "Faculty"
        
        # Determine specific role label if matching HOD
        user = db.query(User).filter(User.id == fp.user_id).first() if fp else None
        if user and user.role:
            role_label = user.role.name

        results.append({
            "id": p.id,
            "date": str(p.date),
            "status": p.status,
            "staff_name": name,
            "employee_id": emp_id,
            "role": role_label
        })
    return results

@router.put("/staff/{attendance_id}/approve")
def approve_staff_attendance(
    attendance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.name != "PRINCIPAL":
        raise HTTPException(status_code=403, detail="Only Principal can approve staff attendance")

    record = db.query(StaffAttendance).filter(StaffAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    record.status = "Present"
    db.commit()
    db.refresh(record)
    return record

@router.put("/staff/{attendance_id}/reject")
def reject_staff_attendance(
    attendance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.name != "PRINCIPAL":
        raise HTTPException(status_code=403, detail="Only Principal can reject staff attendance")

    record = db.query(StaffAttendance).filter(StaffAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    record.status = "Absent"
    db.commit()
    db.refresh(record)
    return record
