from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from backend.db.session import get_db
from backend.models.models import ExamSchedule, ExamResult, User
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

class ExamScheduleCreate(BaseModel):
    subject_id: int
    exam_date: date
    exam_time: str
    duration_minutes: int
    exam_type: str

@router.get("/schedules")
def get_exam_schedules(db: Session = Depends(get_db)):
    schedules = db.query(ExamSchedule).all()
    return schedules

@router.post("/schedules")
def create_exam_schedule(exam_in: ExamScheduleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id != 5: # PRINCIPAL
        raise HTTPException(status_code=403, detail="Only the Principal can schedule exams")
    
    schedule = ExamSchedule(
        subject_id=exam_in.subject_id,
        exam_date=exam_in.exam_date,
        exam_time=exam_in.exam_time,
        duration_minutes=exam_in.duration_minutes,
        exam_type=exam_in.exam_type
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@router.get("/results/{student_id}")
def get_student_results(student_id: int, db: Session = Depends(get_db)):
    from backend.models.models import ExamResult, ExamSchedule, Subject
    
    results = db.query(
        ExamResult.id,
        ExamResult.student_id,
        ExamResult.exam_schedule_id,
        ExamResult.marks_obtained,
        ExamResult.max_marks,
        ExamResult.grade,
        Subject.name.label("subject_name"),
        Subject.code.label("subject_code"),
        Subject.credits.label("subject_credits")
    ).join(
        ExamSchedule, ExamResult.exam_schedule_id == ExamSchedule.id
    ).join(
        Subject, ExamSchedule.subject_id == Subject.id
    ).filter(
        ExamResult.student_id == student_id
    ).all()
    
    out = []
    for r in results:
        out.append({
            "id": r.id,
            "student_id": r.student_id,
            "exam_schedule_id": r.exam_schedule_id,
            "marks_obtained": float(r.marks_obtained) if r.marks_obtained is not None else 0.0,
            "max_marks": float(r.max_marks) if r.max_marks is not None else 100.0,
            "grade": r.grade,
            "subject_name": r.subject_name,
            "subject_code": r.subject_code,
            "subject_credits": r.subject_credits
        })
    return out

@router.post("/results")
def create_exam_result(student_id: int, exam_schedule_id: int, marks: float, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [2, 3, 5, 7]: # HOD, FACULTY, PRINCIPAL, CLASS_COUNSELLOR
        raise HTTPException(status_code=403, detail="Not authorized to submit exam results")

    # Calculate grade
    pct = marks # assuming max marks is 100
    grade = "A" if pct >= 85 else "B" if pct >= 70 else "C" if pct >= 50 else "F"

    result = ExamResult(
        student_id=student_id,
        exam_schedule_id=exam_schedule_id,
        marks_obtained=marks,
        max_marks=100.0,
        grade=grade
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    # Trigger SMTP email sending
    try:
        from backend.models.models import StudentProfile, Subject, ExamSchedule
        sp = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        schedule = db.query(ExamSchedule).filter(ExamSchedule.id == exam_schedule_id).first()
        subject = db.query(Subject).filter(Subject.id == schedule.subject_id).first() if schedule else None
        
        if sp and subject:
            student_email = sp.personal_email or sp.pathshala_email
            student_name = f"{sp.first_name} {sp.last_name}"
            if student_email:
                from backend.services.email import send_smtp_email
                from backend.services.email_templates import get_marks_published_email_html
                
                subj = f"Exam Results Published: {subject.name}"
                body = f"Hello {student_name},\n\nYour scores for {subject.name} have been published: {marks} / 100.0 (Grade: {grade})."
                html_body = get_marks_published_email_html(student_name, subject.name, float(marks), 100.0, grade)
                send_smtp_email(student_email, subj, body, html_body=html_body)
    except Exception as e:
        print(f"[EXAMS EMAIL ERROR] Could not dispatch email: {e}")

    return result
