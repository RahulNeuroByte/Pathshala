from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from pydantic import BaseModel
from datetime import date
from backend.db.session import get_db
from backend.models.models import FeePayment, FeeStructure, SalaryPayment, User
from backend.schemas.schemas import SalaryPaymentOut
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

class FeePaymentCreate(BaseModel):
    student_id: int
    fee_structure_id: int
    amount_paid: float
    payment_method: str
    status: str = "Completed"

class SalaryPayRequest(BaseModel):
    month: str
    year: int

@router.get("/structures")
def get_fee_structures(db: Session = Depends(get_db)):
    structures = db.query(FeeStructure).all()
    return structures

@router.get("/payments/{student_id}")
def get_student_payments(student_id: int, db: Session = Depends(get_db)):
    payments = db.query(FeePayment).filter(FeePayment.student_id == student_id).all()
    return payments

@router.post("/payments")
def create_payment(payment_in: FeePaymentCreate, db: Session = Depends(get_db)):
    payment = FeePayment(
        student_id=payment_in.student_id,
        fee_structure_id=payment_in.fee_structure_id,
        amount_paid=payment_in.amount_paid,
        payment_date=date.today(),
        payment_method=payment_in.payment_method,
        status=payment_in.status
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Trigger SMTP email sending for student payment
    try:
        from backend.models.models import StudentProfile
        sp = db.query(StudentProfile).filter(StudentProfile.id == payment.student_id).first()
        if sp:
            student_email = sp.personal_email or sp.pathshala_email
            student_name = f"{sp.first_name} {sp.last_name}"
            if student_email:
                from backend.services.email import send_smtp_email
                from backend.services.email_templates import get_fee_receipt_email_html
                ref_id = f"REF-{payment.id:04d}-{payment.payment_date.strftime('%Y%m%d')}"
                subj = f"Payment Receipt: {ref_id}"
                body = f"Hello {student_name},\n\nWe have received your payment of Rs. {payment.amount_paid} via {payment.payment_method}. Ref: {ref_id}."
                html_body = get_fee_receipt_email_html(student_name, float(payment.amount_paid), payment.payment_method, ref_id, payment.status)
                send_smtp_email(student_email, subj, body, html_body=html_body)
    except Exception as e:
        print(f"[FEES EMAIL ERROR] Could not dispatch email: {e}")

    return payment

@router.post("/salaries/pay")
def pay_salaries(req: SalaryPayRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized to dispatch salaries")
        
    employees = db.query(User).filter(User.role_id.in_([2, 3, 5, 6, 7])).all()
    payments_made = 0
    for emp in employees:
        receipt_no = f"SAL-{emp.id:03d}-{req.month.upper()}-{req.year}"
        
        # Check if already paid
        existing = db.query(SalaryPayment).filter(SalaryPayment.receipt_no == receipt_no).first()
        if existing:
            continue
            
        amount = 60000.00
        if emp.role_id == 5: # Principal
            amount = 110000.00
        elif emp.role_id == 2: # HOD
            amount = 90000.00
        elif emp.role_id == 7: # CC
            amount = 75050.00
        elif emp.role_id == 6: # Librarian
            amount = 65000.00
        
        payment = SalaryPayment(
            user_id=emp.id,
            amount=amount,
            payment_date=date.today(),
            month=req.month,
            year=req.year,
            status="Paid",
            receipt_no=receipt_no
        )
        db.add(payment)
        
        name = emp.username
        if emp.faculty_profile:
            name = f"{emp.faculty_profile.first_name} {emp.faculty_profile.last_name}"
            
        # Trigger real SMTP salary notification using rich HTML template
        try:
            from backend.services.email import send_smtp_email
            from backend.services.email_templates import get_fee_receipt_email_html
            subj = f"Salary Slip: {receipt_no}"
            body = f"Hello {name},\n\nYour salary of Rs. {amount} has been successfully paid.\nReceipt No: {receipt_no}\n"
            html_body = get_fee_receipt_email_html(name, float(amount), "Bank Transfer", receipt_no, "Dispatched")
            send_smtp_email(emp.email, subj, body, html_body=html_body)
        except Exception as e:
            print(f"[SALARY EMAIL ERROR] Could not dispatch email to {emp.email}: {e}")
        
        payments_made += 1
        
    db.commit()
    return {"message": f"Successfully processed salary payments for {payments_made} employees."}

@router.get("/salaries", response_model=List[SalaryPaymentOut])
def get_salaries(db: Session = Depends(get_db)):
    return db.query(SalaryPayment).order_by(SalaryPayment.payment_date.desc()).all()

@router.get("/salaries/me", response_model=List[SalaryPaymentOut])
def get_my_salaries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SalaryPayment).filter(SalaryPayment.user_id == current_user.id).order_by(SalaryPayment.payment_date.desc()).all()
