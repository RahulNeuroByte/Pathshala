# Pathshala ERP: Academic Administration System

## Project Overview
Pathshala ERP is a comprehensive academic administration system designed to streamline various institutional processes. Built with a modular architecture, it features a FastAPI (Python) backend, a MySQL database, and a React (TypeScript) frontend.

## Key Features
- **Role-Based Access Control (RBAC)**: Admin, HOD, Faculty, and Student.
- **Academic Management**: Attendance, Assignments, Examinations, and Results.
- **Administrative Management**: Fees, Library, and Leave Requests.
- **Reporting & Insights**: Dynamic dashboards and notifications.

---

## Windows & VS Code Setup Guide

This guide provides precise commands for setting up Pathshala ERP on a Windows machine using VS Code.

### 1. Prerequisites
- **VS Code**: [Download here](https://code.visualstudio.com/)
- **Python 3.9+**: [Download here](https://www.python.org/downloads/windows/) (Check "Add Python to PATH")
- **Node.js**: [Download here](https://nodejs.org/)
- **MySQL Server**: [Download here](https://dev.mysql.com/downloads/installer/)

### 2. Initial Setup
Open VS Code, press `Ctrl + ~` to open the terminal, and run:

```powershell
# Clone the project (if not already downloaded)
git clone <repository_url>
cd Pathshala
```

### 3. Backend Setup (Virtual Environment)
In the VS Code terminal:

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit the .env file in the backend folder with your database credentials
notepad .env
```

### 4. Database Setup
Refer to `DATABASE_SETUP.md` for detailed MySQL creation and seeding commands.

### 5. Frontend Setup
Open a new terminal in VS Code:

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### 6. Execution
- **Backend**: In the activated backend terminal: `uvicorn main:app --reload`
- **Frontend**: In the frontend terminal: `npm run dev`
- **API Docs**: Open `http://localhost:8000/api/v1/docs` in your browser.

---

## Logging
The system tracks activity in the following files located in the `logs/` directory:
- `app.log`: General application activity and info.
- `error.log`: Detailed error tracking and exceptions.

## Documentation
- `DATABASE_SETUP.md`: Database creation and seeding.
- `EXECUTION.md`: Detailed running instructions.
- `docs/API_DOCUMENTATION.md`: API endpoint details.
