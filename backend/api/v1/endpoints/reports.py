from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
from backend.db.session import get_db
from backend.api.v1.endpoints.login import get_current_user
from backend.models.models import (
    StudentProfile, FacultyProfile, Department, Course, LeaveRequest, User, 
    FeePayment, SalaryPayment, ExamResult, Subject, ExamSchedule,
    BookIssuance, LibraryBook, AssignmentSubmission, Assignment, Attendance
)
from backend.services.email_templates import (
    get_leave_email_html, get_fee_receipt_email_html, get_marks_published_email_html,
    get_attendance_report_email_html, get_book_issue_email_html,
    get_assignment_submit_email_html, get_placement_letter_email_html,
    get_semester_transcript_html
)

router = APIRouter()

def get_applicant_name_and_role(user: User):
    if user.role_id == 4 and user.student_profile:
        return f"{user.student_profile.first_name} {user.student_profile.last_name}", "Student"
    elif user.faculty_profile:
        return f"{user.faculty_profile.first_name} {user.faculty_profile.last_name}", user.faculty_profile.designation or "Faculty"
    return user.username, user.role.name if user.role else "User"

@router.get("/student/{student_id}")
def get_student_report(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    dept = db.query(Department).filter(Department.id == student.dept_id).first()
    course = db.query(Course).filter(Course.id == student.course_id).first()
    
    from backend.services.reports import generate_student_report
    student_data = {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "roll_no": student.roll_no,
        "dept_name": dept.name if dept else "N/A",
        "course_name": course.name if course else "N/A"
    }
    
    report_path = generate_student_report(student_data)
    return {"report_url": report_path}

@router.get("/print/leave/{leave_id}", response_class=HTMLResponse)
def print_leave_certificate(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    user = db.query(User).filter(User.id == leave.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Applicant user not found")
        
    name, role = get_applicant_name_and_role(user)
    
    html_content = get_leave_email_html(
        applicant_name=name,
        leave_type=leave.leave_type,
        start_date=str(leave.start_date),
        end_date=str(leave.end_date),
        status=leave.status,
        reason=leave.reason,
        is_print=True
    )
    return html_content

@router.get("/print/fee/{payment_id}", response_class=HTMLResponse)
def print_fee_receipt(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(FeePayment).filter(FeePayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Fee payment not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.id == payment.student_id).first()
    student_name = f"{student.first_name} {student.last_name}" if student else "Unknown Student"
    ref_id = f"REF-{payment.id:04d}-{payment.payment_date.strftime('%Y%m%d')}"
    
    html_content = get_fee_receipt_email_html(
        student_name=student_name,
        amount=float(payment.amount_paid),
        payment_method=payment.payment_method,
        reference_id=ref_id,
        status=payment.status,
        is_print=True
    )
    return html_content

@router.get("/print/salary/{payment_id}", response_class=HTMLResponse)
def print_salary_slip(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(SalaryPayment).filter(SalaryPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Salary payment record not found")
        
    user = db.query(User).filter(User.id == payment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee user not found")
        
    name, role = get_applicant_name_and_role(user)
    
    html_content = get_fee_receipt_email_html(
        student_name=name,
        amount=float(payment.amount),
        payment_method="Bank Transfer",
        reference_id=payment.receipt_no,
        status=payment.status,
        is_print=True
    )
    return html_content

@router.get("/print/marks/{exam_result_id}", response_class=HTMLResponse)
def print_marks_card(exam_result_id: int, db: Session = Depends(get_db)):
    result = db.query(ExamResult).filter(ExamResult.id == exam_result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Exam result record not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.id == result.student_id).first()
    student_name = f"{student.first_name} {student.last_name}" if student else "Unknown Student"
    
    # Get subject
    schedule = db.query(ExamSchedule).filter(ExamSchedule.id == result.exam_schedule_id).first()
    subject_name = "Unknown Subject"
    if schedule:
        subject = db.query(Subject).filter(Subject.id == schedule.subject_id).first()
        if subject:
            subject_name = f"{subject.name} ({subject.code})"
            
    html_content = get_marks_published_email_html(
        student_name=student_name,
        subject_name=subject_name,
        marks_obtained=float(result.marks_obtained),
        max_marks=float(result.max_marks),
        grade=result.grade,
        is_print=True
    )
    return html_content

@router.get("/print/attendance/{student_id}", response_class=HTMLResponse)
def print_attendance_report(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student_name = f"{student.first_name} {student.last_name}"
    
    # Pull attendance records
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    subjects = db.query(Subject).filter(Subject.course_id == student.course_id).all()
    subject_map = {s.id: s for s in subjects}
    
    grouped = {}
    for r in records:
        if r.subject_id not in grouped:
            grouped[r.subject_id] = {"attended": 0, "total": 0}
        grouped[r.subject_id]["total"] += 1
        if r.status in ["Present", "Late"]:
            grouped[r.subject_id]["attended"] += 1
            
    details_dict = {}
    total_attended = 0
    total_classes = 0
    
    for sub_id, sub in subject_map.items():
        stats = grouped.get(sub_id, {"attended": 0, "total": 0})
        attended = stats["attended"]
        total = stats["total"]
        pct = round((attended / total) * 100, 1) if total > 0 else 100.0
        details_dict[sub.name] = f"{attended}/{total} classes ({pct}%)"
        total_attended += attended
        total_classes += total
        
    overall_percentage = round((total_attended / total_classes) * 100, 1) if total_classes > 0 else 100.0
    
    html_content = get_attendance_report_email_html(
        student_name=student_name,
        month_name="Academic Year 2026",
        overall_pct=overall_percentage,
        details_dict=details_dict,
        is_print=True
    )
    return html_content

@router.get("/print/book-issue/{issue_id}", response_class=HTMLResponse)
def print_book_issue_slip(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(BookIssuance).filter(BookIssuance.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Book check-out record not found")
        
    book = db.query(LibraryBook).filter(LibraryBook.id == issue.book_id).first()
    book_title = book.title if book else "Unknown Book"
    
    borrower_name = "Library Borrower"
    if issue.student_id:
        sp = db.query(StudentProfile).filter(StudentProfile.id == issue.student_id).first()
        if sp:
            borrower_name = f"{sp.first_name} {sp.last_name}"
    elif issue.faculty_id:
        fp = db.query(FacultyProfile).filter(FacultyProfile.id == issue.faculty_id).first()
        if fp:
            borrower_name = f"{fp.first_name} {fp.last_name}"
            
    html_content = get_book_issue_email_html(
        student_name=borrower_name,
        book_title=book_title,
        due_date=str(issue.due_date),
        status=issue.status,
        is_print=True
    )
    return html_content

@router.get("/print/assignment/{submission_id}", response_class=HTMLResponse)
def print_assignment_receipt(submission_id: int, db: Session = Depends(get_db)):
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Assignment submission not found")
        
    student = db.query(StudentProfile).filter(StudentProfile.id == submission.student_id).first()
    student_name = f"{student.first_name} {student.last_name}" if student else "Unknown Student"
    
    assign = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    assign_title = assign.title if assign else "Homework Assignment"
    subject_code = "GEN-01"
    if assign:
        sub = db.query(Subject).filter(Subject.id == assign.subject_id).first()
        if sub:
            subject_code = sub.code
            
    html_content = get_assignment_submit_email_html(
        student_name=student_name,
        assignment_title=assign_title,
        subject_code=subject_code,
        is_print=True
    )
    return html_content

@router.get("/print/placement/{student_id}", response_class=HTMLResponse)
def print_placement_letter(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    student_name = f"{student.first_name} {student.last_name}"
    offer_date = datetime.now().strftime("%B %d, %Y")
    
    html_content = get_placement_letter_email_html(
        student_name=student_name,
        company_name="Google India Private Limited",
        designation="Software Engineer - Systems Developer",
        ctc_package="Rs. 18,20,000 / Annum",
        offer_date=offer_date,
        is_print=True
    )
    return html_content

@router.get("/print/transcript/{student_id}/{semester_name}", response_class=HTMLResponse)
def print_semester_transcript(student_id: int, semester_name: str, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    course = db.query(Course).filter(Course.id == student.course_id).first()
    course_name = course.name if course else "N/A"
    student_name = f"{student.first_name} {student.last_name}"
    
    ROMAN_SEMS = ["", "Semester I", "Semester II", "Semester III", "Semester IV", "Semester V", "Semester VI", "Semester VII", "Semester VIII"]
    sem_num = 1
    if semester_name in ROMAN_SEMS:
        sem_num = ROMAN_SEMS.index(semester_name)
    else:
        import re
        m = re.search(r'\d+', semester_name)
        if m:
            sem_num = int(m.group(0))
            
    results = db.query(
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
    
    def get_grade_details(marks: float, max_marks: float):
        percent = (marks / max_marks) * 100 if max_marks > 0 else 0
        if percent >= 89: return {'grade': 'O', 'points': 10}
        if percent >= 79: return {'grade': 'A+', 'points': 9}
        if percent >= 70: return {'grade': 'A', 'points': 8}
        if percent >= 60: return {'grade': 'B+', 'points': 7}
        if percent >= 50: return {'grade': 'B', 'points': 6}
        if percent >= 45: return {'grade': 'C', 'points': 5}
        if percent >= 40: return {'grade': 'P', 'points': 4}
        return {'grade': 'F', 'points': 0}
        
    courses_list = []
    sem_gpas = []
    all_sems_gpa = {}
    
    for r in results:
        import re
        match = re.search(r'\(Sem\s*(\d+)\)', r.subject_name, re.IGNORECASE)
        r_sem_num = int(match.group(1)) if match else 1
        r_sem_name = ROMAN_SEMS[r_sem_num] if r_sem_num < len(ROMAN_SEMS) else f"Semester {r_sem_num}"
        
        g_det = get_grade_details(float(r.marks_obtained), float(r.max_marks))
        
        c_res = {
            "code": r.subject_code,
            "name": re.sub(r'\s*\(Sem\s*\d+\)', '', r.subject_name, flags=re.IGNORECASE),
            "credits": r.subject_credits or 4,
            "grade": g_det['grade'],
            "points": g_det['points']
        }
        
        if r_sem_name not in all_sems_gpa:
            all_sems_gpa[r_sem_name] = []
        all_sems_gpa[r_sem_name].append(c_res)
        
        if r_sem_num == sem_num:
            courses_list.append(c_res)
            
    # Calculate GPAs
    target_gpa = "0.00"
    for s_name, s_courses in all_sems_gpa.items():
        total_pts = sum(c['points'] * c['credits'] for c in s_courses)
        total_creds = sum(c['credits'] for c in s_courses)
        gpa_val = (total_pts / total_creds) if total_creds > 0 else 0
        sem_gpas.append(gpa_val)
        if s_name == semester_name:
            target_gpa = f"{gpa_val:.2f}"
            
    cgpa_val = sum(sem_gpas) / len(sem_gpas) if sem_gpas else 0.0
    cgpa = f"{cgpa_val:.2f}"
    
    html_content = get_semester_transcript_html(
        student_name=student_name,
        roll_no=student.roll_no,
        course_name=course_name,
        semester_name=semester_name,
        gpa=target_gpa,
        cgpa=cgpa,
        courses=courses_list,
        is_print=True
    )
    return html_content

@router.get("/principal-tracker")
def get_principal_tracker_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id != 1: # Only ADMIN
        raise HTTPException(status_code=403, detail="Only administrator can access the principal tracker")
    
    from backend.models.models import StaffAttendance, Meeting
    
    # 1. Departments and Courses
    departments = db.query(Department).all()
    courses = db.query(Course).all()
    
    # 2. Exam schedules
    exams = db.query(ExamSchedule).all()
    exam_list = []
    for ex in exams:
        sub = db.query(Subject).filter(Subject.id == ex.subject_id).first()
        exam_list.append({
            "id": ex.id,
            "subject_name": sub.name if sub else "Unknown Subject",
            "subject_code": sub.code if sub else "",
            "exam_date": str(ex.exam_date),
            "exam_time": ex.exam_time,
            "duration_minutes": ex.duration_minutes,
            "exam_type": ex.exam_type
        })
        
    # 3. Meetings scheduled by Principal (host_id = Principal user ID)
    principal_user = db.query(User).filter(User.role_id == 5).first()
    p_meetings = []
    if principal_user:
        meetings = db.query(Meeting).filter(Meeting.host_id == principal_user.id).all()
        for m in meetings:
            p_meetings.append({
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "meeting_date": str(m.meeting_date),
                "meeting_time": m.meeting_time,
                "target_role": m.target_role
            })
            
    # 4. Library Book issuances
    issuances = db.query(BookIssuance).all()
    issue_list = []
    for issue in issuances:
        book = db.query(LibraryBook).filter(LibraryBook.id == issue.book_id).first()
        borrower_name = "Library Borrower"
        borrower_role = "N/A"
        if issue.student_id:
            sp = db.query(StudentProfile).filter(StudentProfile.id == issue.student_id).first()
            if sp:
                borrower_name = f"{sp.first_name} {sp.last_name}"
                borrower_role = "Student"
        elif issue.faculty_id:
            fp = db.query(FacultyProfile).filter(FacultyProfile.id == issue.faculty_id).first()
            if fp:
                borrower_name = f"{fp.first_name} {fp.last_name}"
                borrower_role = "Faculty / Staff"
        issue_list.append({
            "id": issue.id,
            "book_title": book.title if book else "Unknown Book",
            "borrower_name": borrower_name,
            "borrower_role": borrower_role,
            "issue_date": str(issue.issue_date),
            "due_date": str(issue.due_date),
            "return_date": str(issue.return_date) if issue.return_date else None,
            "status": issue.status
        })
        
    # 5. Staff Attendance Approvals (Principal has verdict control)
    staff_att = db.query(StaffAttendance).all()
    att_list = []
    for att in staff_att:
        fp = att.faculty_profile
        name = f"{fp.first_name} {fp.last_name}" if fp else "Unknown Staff"
        emp_id = fp.employee_id if fp else ""
        role_label = fp.designation or "Faculty"
        
        # Resolve user role
        user = db.query(User).filter(User.id == fp.user_id).first() if fp else None
        if user and user.role:
            role_label = user.role.name
            
        att_list.append({
            "id": att.id,
            "date": str(att.date),
            "status": att.status,
            "staff_name": name,
            "employee_id": emp_id,
            "role": role_label
        })
        
    # 6. Leaves handled by Principal (HOD (2), Faculty (3), Librarian (6), Class Counsellor (7) leaves)
    staff_users = db.query(User).filter(User.role_id.in_([2, 3, 6, 7])).all()
    staff_user_ids = [u.id for u in staff_users]
    leaves = db.query(LeaveRequest).filter(LeaveRequest.user_id.in_(staff_user_ids)).all()
    leaves_list = []
    for l in leaves:
        applicant = db.query(User).filter(User.id == l.user_id).first()
        app_name = "Unknown"
        app_role = "Staff"
        if applicant:
            if applicant.faculty_profile:
                app_name = f"{applicant.faculty_profile.first_name} {applicant.faculty_profile.last_name}"
                app_role = applicant.faculty_profile.designation or "Faculty"
            else:
                app_name = applicant.username
                app_role = applicant.role.name if applicant.role else "User"
        leaves_list.append({
            "id": l.id,
            "applicant_name": app_name,
            "applicant_role": app_role,
            "leave_type": l.leave_type,
            "start_date": str(l.start_date),
            "end_date": str(l.end_date),
            "reason": l.reason,
            "status": l.status
        })

    return {
        "departments": [{"id": d.id, "name": d.name, "code": d.code} for d in departments],
        "courses": [{"id": c.id, "name": c.name, "code": c.code, "duration_years": c.duration_years} for c in courses],
        "exams": exam_list,
        "meetings": p_meetings,
        "library_issuances": issue_list,
        "staff_attendance": att_list,
        "leaves": leaves_list
    }

