# Pathshala ERP: Execution Guide (Windows)

Detailed instructions for running the Pathshala ERP system.

## 1. Backend Execution (VS Code)

1. Open the `Pathshala` folder in VS Code.
2. Open a terminal (`Ctrl + ~`).
3. Activate the virtual environment from the root directory:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Run the server:
   ```powershell
   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Note: Access swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*
 
## 2. Frontend Execution (VS Code)

1. Open a second terminal in VS Code.
2. Navigate and run:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Access the app at: `http://localhost:5173`

## 3. Docker Execution (Alternative)

If you have Docker Desktop installed on Windows:

```powershell
# From the project root
docker-compose up --build
```

## 4. Logging & Monitoring
Check the `logs/` folder in the project root:
- `app.log`: Monitor `tail -f logs/app.log` (in Git Bash) or open in VS Code.
- `error.log`: Check for any runtime exceptions.

## 5. Troubleshooting
- **Virtual Environment**: If `.\venv\Scripts\activate` fails, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` in PowerShell.
- **Port Conflict**: If port 8000 is busy, use `uvicorn main:app --port 8001`.
- **MySQL Connection**: Ensure the `DATABASE_URL` in `.env` matches your MySQL credentials.
