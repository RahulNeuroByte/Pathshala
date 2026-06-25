import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

REPORTS_DIR = "/home/ubuntu/Pathshala/assets/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_student_report(student_data: dict):
    filename = f"student_report_{student_data['roll_no']}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Pathshala ERP - Student Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 100, f"Name: {student_data['first_name']} {student_data['last_name']}")
    c.drawString(100, height - 120, f"Roll No: {student_data['roll_no']}")
    c.drawString(100, height - 140, f"Department: {student_data['dept_name']}")
    c.drawString(100, height - 160, f"Course: {student_data['course_name']}")
    
    c.save()
    return filepath
