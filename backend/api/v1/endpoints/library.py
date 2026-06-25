from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from pydantic import BaseModel
from backend.db.session import get_db
from backend.models.models import LibraryBook, BookIssuance, User
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    quantity_total: int
    publication_year: int

class IssuanceStatusUpdate(BaseModel):
    status: str

@router.get("/books")
def get_books(db: Session = Depends(get_db)):
    books = db.query(LibraryBook).all()
    return books

@router.get("/issuance/{student_id}")
def get_student_issuance(student_id: int, db: Session = Depends(get_db)):
    issuance = db.query(BookIssuance).filter(BookIssuance.student_id == student_id).all()
    return issuance

@router.get("/issuances")
def get_all_issuances(db: Session = Depends(get_db)):
    from backend.models.models import StudentProfile, FacultyProfile, Department, Course
    issuances = db.query(BookIssuance).order_by(BookIssuance.id.desc()).all()
    results = []
    for issue in issuances:
        book = db.query(LibraryBook).filter(LibraryBook.id == issue.book_id).first()
        borrower_info = {}
        if issue.student_id:
            sp = db.query(StudentProfile).filter(StudentProfile.id == issue.student_id).first()
            if sp:
                dept_name = db.query(Department.name).filter(Department.id == sp.dept_id).scalar() or "N/A"
                course_name = db.query(Course.name).filter(Course.id == sp.course_id).scalar() or "N/A"
                borrower_info = {
                    "type": "student",
                    "name": f"{sp.first_name} {sp.last_name}",
                    "roll_no": sp.roll_no,
                    "email": sp.pathshala_email,
                    "course": course_name,
                    "dept": dept_name,
                    "sem": sp.current_semester,
                    "section": sp.section
                }
        elif issue.faculty_id:
            fp = db.query(FacultyProfile).filter(FacultyProfile.id == issue.faculty_id).first()
            if fp:
                dept_name = db.query(Department.name).filter(Department.id == fp.dept_id).scalar() or "N/A"
                borrower_info = {
                    "type": "faculty",
                    "name": f"{fp.first_name} {fp.last_name}",
                    "faculty_id": fp.employee_id,
                    "dept": dept_name,
                    "timetable": f"CC Section {fp.section or 'N/A'}"
                }
        results.append({
            "id": issue.id,
            "book_title": book.title if book else "Unknown Book",
            "book_isbn": book.isbn if book else "",
            "issue_date": str(issue.issue_date) if issue.issue_date else "",
            "due_date": str(issue.due_date) if issue.due_date else "",
            "return_date": str(issue.return_date) if issue.return_date else None,
            "status": issue.status,
            "borrower": borrower_info
        })
    return results

@router.post("/books")
def add_book(book_in: BookCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [5, 6]: # PRINCIPAL or LIBRARIAN
        raise HTTPException(status_code=403, detail="Not authorized to add library books")
    
    book = LibraryBook(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        quantity_total=book_in.quantity_total,
        quantity_available=book_in.quantity_total,
        publication_year=book_in.publication_year
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@router.post("/issue")
def issue_book(book_id: int, student_id: Optional[int] = None, faculty_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [5, 6]: # PRINCIPAL or LIBRARIAN
        raise HTTPException(status_code=403, detail="Not authorized to issue books")
    
    book = db.query(LibraryBook).filter(LibraryBook.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.quantity_available <= 0:
        raise HTTPException(status_code=400, detail="Book not available")
        
    book.quantity_available -= 1
    issue_date = date.today()
    due_date = issue_date + timedelta(days=14)
    issuance = BookIssuance(
        student_id=student_id,
        faculty_id=faculty_id,
        book_id=book_id,
        issue_date=issue_date,
        due_date=due_date,
        status="Issued"
    )
    db.add(issuance)
    db.commit()
    db.refresh(issuance)

    # Trigger SMTP email sending
    borrower_email = None
    borrower_name = "Borrower"
    
    if student_id:
        from backend.models.models import StudentProfile
        sp = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if sp:
            borrower_email = sp.personal_email or sp.pathshala_email
            borrower_name = f"{sp.first_name} {sp.last_name}"
    elif faculty_id:
        from backend.models.models import FacultyProfile
        fp = db.query(FacultyProfile).filter(FacultyProfile.id == faculty_id).first()
        if fp:
            borrower_email = fp.personal_email or fp.pathshala_email
            borrower_name = f"{fp.first_name} {fp.last_name}"
            
    if borrower_email:
        try:
            from backend.services.email import send_smtp_email
            from backend.services.email_templates import get_book_issue_email_html
            subject = f"Library Book Issued: {book.title}"
            body = f"Hello {borrower_name},\n\nBook '{book.title}' has been successfully issued to you. Due date is {due_date}."
            html_body = get_book_issue_email_html(borrower_name, book.title, str(due_date), "Issued")
            send_smtp_email(borrower_email, subject, body, html_body=html_body)
        except Exception as e:
            print(f"[LIBRARY EMAIL ERROR] Could not dispatch email: {e}")

    return issuance


@router.put("/issuance/{issuance_id}/status")
def update_issuance_status(issuance_id: int, data: IssuanceStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [5, 6]: # PRINCIPAL or LIBRARIAN
        raise HTTPException(status_code=403, detail="Not authorized to update issuance status")
        
    issuance = db.query(BookIssuance).filter(BookIssuance.id == issuance_id).first()
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance record not found")
        
    old_status = issuance.status
    new_status = data.status
    issuance.status = new_status
    
    if new_status == "Returned" and old_status != "Returned":
        issuance.return_date = date.today()
        book = db.query(LibraryBook).filter(LibraryBook.id == issuance.book_id).first()
        if book:
            book.quantity_available = min(book.quantity_total, book.quantity_available + 1)
    elif new_status != "Returned" and old_status == "Returned":
        issuance.return_date = None
        book = db.query(LibraryBook).filter(LibraryBook.id == issuance.book_id).first()
        if book:
            book.quantity_available = max(0, book.quantity_available - 1)
            
    db.commit()
    db.refresh(issuance)
    return issuance
