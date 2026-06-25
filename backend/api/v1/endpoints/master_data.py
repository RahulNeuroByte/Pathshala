from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.db.session import get_db
from backend.models.models import Department, Course, User, Subject
from backend.api.v1.endpoints.login import get_current_user

router = APIRouter()

@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()


class DepartmentCreate(BaseModel):
    name: str
    code: str

class CourseCreate(BaseModel):
    dept_id: int
    name: str
    code: str
    duration_years: int

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/departments")
def create_department(dept_in: DepartmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [5]: # PRINCIPAL
        raise HTTPException(status_code=403, detail="Not authorized to create departments")
    
    # Check if exists
    existing = db.query(Department).filter(
        (Department.name == dept_in.name) | (Department.code == dept_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")

    dept = Department(name=dept_in.name, code=dept_in.code)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.post("/courses")
def create_course(course_in: CourseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role_id not in [5]: # PRINCIPAL
        raise HTTPException(status_code=403, detail="Not authorized to create courses")
    
    # Check if exists
    existing = db.query(Course).filter(Course.code == course_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course with this code already exists")

    course = Course(
        dept_id=course_in.dept_id,
        name=course_in.name,
        code=course_in.code,
        duration_years=course_in.duration_years
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course
