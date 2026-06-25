# Pathshala ERP API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All endpoints (except login) require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication
- **POST** `/login/access-token` - Login with username and password

### Users
- **GET** `/users/` - Get all users
- **POST** `/users/` - Create a new user
- **GET** `/users/{user_id}` - Get user details

### Students
- **GET** `/students/` - Get all students
- **GET** `/students/{student_id}` - Get student details

### Faculty
- **GET** `/faculty/` - Get all faculty members
- **GET** `/faculty/{faculty_id}` - Get faculty details

### Fees
- **GET** `/fees/structures` - Get fee structures
- **GET** `/fees/payments/{student_id}` - Get student payments
- **POST** `/fees/payments` - Create payment record

### Exams
- **GET** `/exams/schedules` - Get exam schedules
- **GET** `/exams/results/{student_id}` - Get student exam results
- **POST** `/exams/results` - Record exam result

### Assignments
- **GET** `/assignments/` - Get all assignments
- **GET** `/assignments/{assignment_id}/submissions` - Get submissions
- **POST** `/assignments/{assignment_id}/submit` - Submit assignment

### Library
- **GET** `/library/books` - Get library books
- **GET** `/library/issuance/{student_id}` - Get student book issuance
- **POST** `/library/issue` - Issue book to student

## Response Format
All responses follow this format:
```json
{
  "data": {},
  "status": "success",
  "message": "Operation successful"
}
```

## Error Handling
Errors return appropriate HTTP status codes with error details:
```json
{
  "detail": "Error message",
  "status": "error"
}
```
