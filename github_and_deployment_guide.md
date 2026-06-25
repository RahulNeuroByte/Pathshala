# GitHub Push & Cloud Deployment Guide

This guide details how to login to GitHub, create a repository, push your files, and deploy the application to production:
1. **Backend & Database** -> Oracle Cloud Free Tier (Ubuntu VM + Docker)
2. **Frontend UI** -> Cloudflare Pages (Vite + Nginx Build)

---

## Part 1: GitHub Push Guide

### Step 1: Install Git & Initialize Local Repository
Open your terminal (PowerShell or Bash) in the project root directory (`d:\Pathshala`) and run:
```bash
# Initialize git
git init

# Rename default branch to main
git branch -M main
```

### Step 2: Confirm the `.gitignore` File
A comprehensive `.gitignore` file has already been created at the root of your project directory (`d:\Pathshala\.gitignore`). This file automatically prevents Git from tracking large/temporary directories and sensitive environment secrets:
- Python virtual environments (`venv/`) and cache (`__pycache__/`, `.pytest_cache/`)
- Frontend packages (`node_modules/`) and build outputs (`dist/`)
- Local configuration secrets (`.env`, `frontend/.env`)
- Upload directories (`uploads/`) and system logs (`logs/`)


### Step 3: Login to GitHub via CLI (Alternative to Web)
You can login using GitHub CLI (`gh`) or standard Git with a Personal Access Token (PAT).
* **Using GitHub CLI**:
  ```bash
  gh auth login
  # Select GitHub.com -> HTTPS -> Login with a web browser (Paste the code shown)
  ```
* **Using Git PAT**:
  When pushing, enter your GitHub Username and use your **Personal Access Token (PAT)** as the password.

### Step 4: Create a New GitHub Repository
* **Option A: Using GitHub CLI**:
  ```bash
  gh repo create PathshalaERP --public --source=. --remote=origin
  ```
* **Option B: Using GitHub Web UI**:
  1. Open [GitHub](https://github.com) and click **New Repository**.
  2. Name it `PathshalaERP`. Keep it **Public** (or Private). Do not initialize it with a README/License.
  3. Copy the remote URL and link it to your local git:
     ```bash
     git remote add origin https://github.com/<your-username>/PathshalaERP.git
     ```

### Step 5: Commit and Push All Code
Stage, commit, and push your repository:
```bash
# Stage all files
git add .

# Create the initial commit
git commit -m "feat: complete Pathshala ERP dashboard, salaries, and enrollment modules"

# Push all files to main branch
git push -u origin main
```

---

## Part 2: Backend Deployment on Oracle Cloud Free Tier

Oracle Cloud Free Tier compute instances are perfect for running your database and FastAPI backend.

### Step 1: Provision an Ubuntu VM Compute Instance
1. Go to Oracle Cloud Infrastructure (OCI) Console -> **Instances** -> **Create Instance**.
2. Select **Canonical Ubuntu 22.04** (or AMD VM.Standard.E2.1.Micro / Ampere A1 Compute).
3. Download your Private SSH Key (`private_key.key`).
4. Keep the default Virtual Cloud Network (VCN) and subnet. Click **Create**.

### Step 2: Open Ingress Ports in Security Lists (VCN)
To allow external connections to your backend API, open port `8000`:
1. In OCI Instance Details, click on **Virtual Cloud Network** -> **Public Subnet**.
2. Click on the **Default Security List**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   * **Source CIDR**: `0.0.0.0/0`
   * **IP Protocol**: `TCP`
   * **Destination Port Range**: `8000`
   * **Description**: `Allow FastAPI backend ingress traffic`
4. *(Optional)* Add another rule for MySQL port `3306` if you wish to connect directly to the database from external database clients (not recommended in production unless secured).

### Step 3: SSH into your Oracle Compute Instance
On your local machine, open your SSH terminal and login using your public IP:
```bash
# Windows PowerShell example
ssh -i .\private_key.key ubuntu@<YOUR_ORACLE_VM_PUBLIC_IP>
```

### Step 4: Install Docker and Docker Compose on the VM
Once inside the Ubuntu VM, run:
```bash
# Update Ubuntu repos
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Install Docker Compose
sudo apt-get install docker-compose-v2 -y
```

### Step 5: Deploy Backend Services
Clone the repository and run only the backend and database containers:
```bash
# Clone the repo on the VM
git clone https://github.com/<your-username>/PathshalaERP.git
cd PathshalaERP

# Create production .env file
nano .env
```
Paste your production environment variables (e.g. database credentials):
```env
DATABASE_URL=mysql+mysqlconnector://root:prod_password@db/pathshala_db
MYSQL_ROOT_PASSWORD=prod_password
MYSQL_DATABASE=pathshala_db
```
Spin up the database and backend services using docker compose:
```bash
# Spin up only the db and backend service
docker compose -f docker/docker-compose.yml up -d db backend
```
Verify the backend is running and listening:
```bash
docker compose -f docker/docker-compose.yml ps
curl http://localhost:8000/api/v1/departments
```

---

## Part 3: Frontend Deployment on Cloudflare Pages

Cloudflare Pages is a lightning-fast, secure, and free hosting platform for static single-page web applications (Vite, React).

### Step 1: Connect your GitHub Account
1. Log in or register at [Cloudflare](https://dash.cloudflare.com/).
2. In the sidebar, select **Workers & Pages** -> **Create Application**.
3. Click on the **Pages** tab and click **Connect to Git**.
4. Authorize Cloudflare to access your GitHub account and select your `PathshalaERP` repository.

### Step 2: Configure Build and Deployment Parameters
Set up the build parameters exactly as follows:
* **Project Name**: `pathshala-erp`
* **Production Branch**: `main`
* **Framework Preset**: `Vite`
* **Root Directory**: `frontend`  *(This instructs Cloudflare to look inside the frontend directory for package.json)*
* **Build Command**: `npm run build`
* **Build Output Directory**: `dist`

### Step 3: Add Build Environment Variable (`VITE_API_URL`)
To link your Cloudflare frontend to your live Oracle Cloud backend:
1. Under **Environment variables (advanced)**, click **Add Variable**:
   * **Variable Name**: `VITE_API_URL`
   * **Value**: `http://<YOUR_ORACLE_VM_PUBLIC_IP>:8000/api/v1`
2. Click **Save and Deploy**.

### Step 4: Access your Application
Cloudflare will automatically compile, build, and deploy the application. 
Once completed, it will provide a free public subdomain (e.g. `https://pathshala-erp.pages.dev`). Open the URL to access your fully deployed ERP system!
