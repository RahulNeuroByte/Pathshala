from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.models.models import Holiday

router = APIRouter()

@router.get("/")
def get_holidays(db: Session = Depends(get_db)):
    holidays = db.query(Holiday).all()
    return holidays
