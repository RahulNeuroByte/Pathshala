from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.models import Assignment, AssignmentSubmission, Notification, Attendance, StudentProfile

router = APIRouter()

@router.get("/")
def get_assignments(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).all()
    return assignments

@router.get("/{assignment_id}/submissions")
def get_submissions(assignment_id: int, db: Session = Depends(get_db)):
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()
    return submissions

@router.post("/{assignment_id}/submit")
def submit_assignment(assignment_id: int, student_id: int, file_path: str, db: Session = Depends(get_db)):
    from datetime import date, datetime
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=student_id,
        submission_date=datetime.now(),
        file_path=file_path
    )
    db.add(submission)
    db.flush()
    
    faculty = assignment.faculty_profile
    if faculty and faculty.user_id:
        notif = Notification(
            user_id=faculty.user_id,
            title="New Assignment Submission",
            message=f"Student {student.first_name} {student.last_name} ({student.roll_no}) has submitted assignment '{assignment.title}'."
        )
        db.add(notif)
        
    today = date.today()
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.subject_id == assignment.subject_id,
        Attendance.date == today
    ).first()
    
    if not existing_attendance:
        new_attendance = Attendance(
            student_id=student_id,
            subject_id=assignment.subject_id,
            faculty_id=assignment.faculty_id,
            date=today,
            status="Present"
        )
        db.add(new_attendance)
        
    db.commit()
    db.refresh(submission)

    # Trigger SMTP email sending
    student_email = student.personal_email or student.pathshala_email
    student_name = f"{student.first_name} {student.last_name}"
    subject_code = assignment.subject.code if assignment.subject else "N/A"
    if student_email:
        try:
            from backend.services.email import send_smtp_email
            from backend.services.email_templates import get_assignment_submit_email_html
            subj = f"Assignment Submitted: {assignment.title}"
            body = f"Hello {student_name},\n\nYour assignment '{assignment.title}' for subject {subject_code} has been successfully submitted."
            html_body = get_assignment_submit_email_html(student_name, assignment.title, subject_code)
            send_smtp_email(student_email, subj, body, html_body=html_body)
        except Exception as e:
            print(f"[ASSIGNMENT EMAIL ERROR] Could not dispatch email: {e}")

    return submission
