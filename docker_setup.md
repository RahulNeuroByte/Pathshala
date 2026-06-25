# Docker Setup & Command Guide

This guide provides step-by-step instructions to build, run, and manage the Pathshala ERP application using Docker and Docker Compose.

---

## 1. Prerequisites

Before running the commands, ensure you have the following installed on your machine:
* **Docker Desktop** (for Windows or macOS) or **Docker Engine & Compose** (for Linux).
  * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
* Verify your installation by running:
  ```bash
  docker --version
  docker compose version
  ```

---

## 2. Docker Files Architecture

The project contains the following Docker files under the `docker/` directory:

1. **`docker/Dockerfile`**: Compiles the FastAPI backend and installs MySQL client dependencies.
2. **`docker/Dockerfile.frontend`**: A multi-stage build that compiles the Vite React frontend using Node 18 and serves the static assets using Nginx.
3. **`docker/nginx.conf`**: Configures Nginx to serve the static frontend and reverse proxy `/api/` requests to the backend service.
4. **`docker/docker-compose.yml`**: Coordinates the MySQL database, FastAPI backend, and React frontend containers.

---

## 3. Detailed Docker Commands

All the following commands should be executed from the **project root directory** (where `docker/` is located).

### A. Spin Up the Complete Stack
To build and run all services (Database, Backend, and Frontend) in the background:
```bash
docker compose -f docker/docker-compose.yml up -d --build
```
* `-f docker/docker-compose.yml` specifies the location of the compose file.
* `up` launches the containers.
* `-d` runs them in detached mode (in the background).
* `--build` forces a rebuild of the Docker images before launching.

Once started:
* **Frontend Application**: Accessible at [http://localhost:3000](http://localhost:3000)
* **Backend FastAPI Docs**: Accessible at [http://localhost:8000/docs](http://localhost:8000/docs)
* **MySQL Database**: Exposed on port `3306`

### B. View Live Container Logs
To follow live logs from all running services:
```bash
docker compose -f docker/docker-compose.yml logs -f
```
To view logs for a specific service (e.g., just the backend):
```bash
docker compose -f docker/docker-compose.yml logs -f backend
```

### C. Stop and Remove Containers
To stop the application and clean up containers, networks, and internal resources (retaining database data):
```bash
docker compose -f docker/docker-compose.yml down
```
To stop the application **and wipe the database volume** (useful for a fresh seed clean install):
```bash
docker compose -f docker/docker-compose.yml down -v
```

### D. Rebuild Individual Services
If you make changes to backend code or frontend source and want to rebuild only that specific service:
```bash
# Rebuild and restart the backend service
docker compose -f docker/docker-compose.yml up -d --build backend

# Rebuild and restart the frontend service
docker compose -f docker/docker-compose.yml up -d --build frontend
```

### E. Access the Live MySQL Database Container
To log directly into the running MySQL command line client inside the database container:
```bash
docker compose -f docker/docker-compose.yml exec db mysql -u root -p
# Enter 'password' when prompted
```

Once logged in, you can run standard SQL statements:
```sql
USE pathshala_db;
SHOW TABLES;
SELECT * FROM users LIMIT 10;
```

---

## 4. Troubleshooting & Database Seeding

* **First Boot Initialization**: The database container is configured to automatically run `schema.sql` and `seed_data.sql` during its very first boot using the `/docker-entrypoint-initdb.d/` mount volume.
* **Re-seeding the Database**: If you need to wipe and reset the seeded tables, run:
  ```bash
  # Stop and wipe volume
  docker compose -f docker/docker-compose.yml down -v
  # Re-launch with fresh database initialization
  docker compose -f docker/docker-compose.yml up -d
  ```
