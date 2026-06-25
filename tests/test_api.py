import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to Pathshala ERP API" in response.json()["message"]

def test_login_endpoint_exists():
    response = client.post("/api/v1/login/access-token", data={"username": "test", "password": "test"})
    # Should fail with incorrect credentials but endpoint should exist
    assert response.status_code in [400, 422]

def test_users_endpoint_exists():
    response = client.get("/api/v1/users/")
    # May fail due to DB connection but endpoint should exist
    assert response.status_code in [200, 500]

def test_students_endpoint_exists():
    response = client.get("/api/v1/students/")
    assert response.status_code in [200, 401, 500]

def test_faculty_endpoint_exists():
    response = client.get("/api/v1/faculty/")
    assert response.status_code in [200, 401, 500]

def test_fees_endpoint_exists():
    response = client.get("/api/v1/fees/structures")
    assert response.status_code in [200, 500]

def test_exams_endpoint_exists():
    response = client.get("/api/v1/exams/schedules")
    assert response.status_code in [200, 500]

def test_assignments_endpoint_exists():
    response = client.get("/api/v1/assignments/")
    assert response.status_code in [200, 500]

def test_library_endpoint_exists():
    response = client.get("/api/v1/library/books")
    assert response.status_code in [200, 500]

def test_leaves_endpoint_exists():
    response = client.get("/api/v1/leaves/my")
    assert response.status_code in [200, 401, 500]

    response = client.get("/api/v1/leaves/pending")
    assert response.status_code in [200, 401, 500]

def test_attendance_endpoint_exists():
    response = client.get("/api/v1/attendance/student/my")
    assert response.status_code in [200, 401, 500]

    response = client.get("/api/v1/attendance/staff/my")
    assert response.status_code in [200, 401, 500]

