from fastapi import APIRouter
from backend.api.v1.endpoints import login, users, students, faculty, fees, exams, assignments, library, reports, holidays, meetings, master_data, leaves, attendance, collaboration

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(fees.router, prefix="/fees", tags=["fees"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(library.router, prefix="/library", tags=["library"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(holidays.router, prefix="/holidays", tags=["holidays"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(master_data.router, tags=["master_data"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["leaves"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(collaboration.router, prefix="/collaboration", tags=["collaboration"])


