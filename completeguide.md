# Pathshala ERP: End-to-End Setup & Run Guide

This guide provides end-to-end setup instructions, execution orders, and verification steps to deploy and run **Pathshala ERP** on any machine (specifically Windows/VS Code environment).

---

## 1. Directory Structure Overview
Here is how the project components are organized:
* `database/`: SQL schemas (`schema.sql`), seeds (`seed.py`), and generated seed data.
* `backend/`: FastAPI Python application containing APIs, models, schemas, and configurations.
* `frontend/`: React + Vite + TypeScript application containing views, styling, and services.
* `scripts/`: Diagnostic and maintenance scripts (e.g. database schema updates).
* `uploads/`: Dynamic file storage for user uploaded profile photos (automatically created).

---

## 2. Order of Setup and Startup Commands

Follow these steps in exact order to deploy the application on a new machine.

### Step A: Prerequisites Setup
Make sure you have installed:
1. **Python 3.9+** (Ensure "Add Python to PATH" is checked during installation).
2. **Node.js 18+** (LTS version recommended).
3. **MySQL Server** (Ensure MySQL is running on port `3306`).

---

### Step B: Database Setup (MySQL)
Open your MySQL terminal or client (e.g. Command Prompt) and run:

1. **Log in to MySQL as root**:
   ```cmd
   mysql -u root -p
   ```
   *(Enter your root password when prompted)*

2. **Create the Database and User**:
   Run the following queries at the MySQL prompt:
   ```sql
   CREATE DATABASE pathshala_db;
   USE pathshala_db;

   -- Create application user and grant permissions
   CREATE USER 'pathshala_user'@'localhost' IDENTIFIED BY 'Pathshala@123';
   GRANT ALL PRIVILEGES ON pathshala_db.* TO 'pathshala_user'@'localhost';
   CREATE USER 'pathshala_user'@'127.0.0.1' IDENTIFIED BY 'Pathshala@123';
   GRANT ALL PRIVILEGES ON pathshala_db.* TO 'pathshala_user'@'127.0.0.1';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Apply the Schemas**:
   From the project root directory, run the following commands to initialize the schema:
   ```cmd
   mysql -u root -p pathshala_db < database/schema.sql
   mysql -u root -p pathshala_db < database/schema_extended.sql
   ```

---

### Step C: Backend Environment Setup
1. **Initialize Virtual Environment**:
   Navigate to the project root directory and run:
   ```cmd
   python -m venv venv
   ```

2. **Activate the Virtual Environment**:
   * **PowerShell**:
     ```powershell
     .\venv\Scripts\activate
     ```
   * **CMD**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```

3. **Install Dependencies**:
   ```cmd
   pip install -r backend/requirements.txt
   ```

4. **Verify / Generate Environment Configuration (`.env`)**:
   Ensure a `.env` file exists in the root directory. If not, create it with the following contents:
   ```env
   PROJECT_NAME="Pathshala ERP"
   API_V1_STR="/api/v1"
   SECRET_KEY="super-secret-key-for-pathshala-erp"
   ACCESS_TOKEN_EXPIRE_MINUTES=11520
   DATABASE_URL="mysql+mysqlconnector://pathshala_user:Pathshala%40123@127.0.0.1:3306/pathshala_db"
   ```

---

### Step D: Database Seeding & Schema Migrations
Before starting, we will populate the initial records (100 students, 25 faculty) and execute migrations:

1. **Populate initial records**:
   ```cmd
   python database/seed.py
   mysql -u root -p pathshala_db < database/seed_data.sql
   ```

2. **Run schema updates** (safely appends new columns like `profile_photo` without breaking existing tables):
   ```cmd
   python scripts/update_db.py
   ```

---

### Step E: Running the Backend Server
From the project root (with `venv` activated):
```cmd
set PYTHONPATH=.
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
* **Verify Backend is running**: Access API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.

---

### Step F: Frontend Setup & Run
Open a second terminal window.

1. **Navigate to the frontend directory**:
   ```cmd
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```cmd
   npm install
   ```

3. **Run development server**:
   ```cmd
   npm run dev
   ```
* **Access Application**: Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Demo User Credentials (Roles Portal)

You can sign in using credentials from any of the following roles:

| Role | Username | Password | Access Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin@pathshala` | Full dashboard settings, user enrollment, database tools. |
| **CS Dept HOD** | `hod1` | `faculty@pathshala` | Department views, faculty assignments, notice bulletins. |
| **Faculty Member** | `faculty1` | `faculty@pathshala` | Grade entry sheets, student attendance tracker, assignments board. |
| **Student** | `student1` | `student@pathshala` | Exam results view, timetables, fee receipts, book issuance. |

---

## 4. Key Features Walkthrough

### 👤 Profile Photo Upload
1. Log in to any account (e.g. `student1` or `admin`).
2. Go to **Profile Settings** (accessible via the profile dropdown in the top-right navbar).
3. Hover your cursor over the circular avatar initials block.
4. Click **"Change Photo"** and select any image (`.jpg`/`.png`) from your machine.
5. The photo is securely uploaded to `/uploads` on the backend, stored in the database, and updated dynamically across both the sidebar panel and top navbar avatar instantly.

### 🎓 Dynamic Actions
* **Student Workspace**: Navigate to the student workspace page to search, filter cohorts, and update student profiles dynamically.
* **Attendance sheets**: Faculty members can review active semester cohorts and log attendances.
* **Security Password Reset**: Change account security passwords or reset credentials directly via the profile page.
