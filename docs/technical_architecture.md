# Pathshala ERP: Technical Architecture

## System Overview
Pathshala is a modular ERP system for academic administration. It follows a layered architecture to ensure separation of concerns and ease of maintenance.

## Architecture Layers

### 1. Database Layer
- **MySQL**: Relational database for structured data.
- **SQLAlchemy**: ORM for Python-based database interaction.
- **Migrations**: Managed via Alembic (planned).

### 2. Backend Layer (FastAPI)
- **Core**: Configuration, security, and authentication logic.
- **Models**: SQLAlchemy database models.
- **Schemas**: Pydantic models for request/response validation.
- **API**: Versioned endpoints (v1) organized by module.
- **Middleware**: CORS, logging, and exception handling.

### 3. Frontend Layer (React)
- **Framework**: React with TypeScript.
- **Styling**: Tailwind CSS for responsive UI.
- **State Management**: React Hooks and Context API.
- **API Client**: Axios for backend communication.

## Key Workflows
- **Authentication**: Users log in via `/api/v1/login/access-token` to receive a JWT.
- **Authorization**: Role-based access control (RBAC) is enforced at the API level.
- **Data Flow**: Frontend (React) -> API (FastAPI) -> ORM (SQLAlchemy) -> DB (MySQL).

## Deployment
- Containerized using **Docker** and **Docker Compose**.
- Backend runs on Uvicorn.
- Frontend served via Nginx (production) or Vite (development).
