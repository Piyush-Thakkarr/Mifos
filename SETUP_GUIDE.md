# Client Portal Setup Guide (Mac)

This guide will help you set up the Client Portal on a new Mac laptop.

## Prerequisites

1. **Python 3.11+** - Check if installed:
   ```bash
   python3 --version
   ```
   If not installed, download from [python.org](https://www.python.org/downloads/)

2. **Node.js 20.x** - Check if installed:
   ```bash
   node --version
   ```
   If not installed, download from [nodejs.org](https://nodejs.org/)

3. **Git** - Usually pre-installed on Mac, check with:
   ```bash
   git --version
   ```

## Step 1: Clone/Download the Project

If using Git:
```bash
git clone <your-repo-url>
cd mifos-main/Mifos
```

Or if you have the project folder, navigate to it:
```bash
cd /path/to/mifos-main/Mifos
```

## Step 2: Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the frontend:**
   ```bash
   ng serve
   ```
   The frontend will be available at `http://localhost:4200`

## Step 3: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd portal_backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python3 -m venv .venv
   ```

3. **Activate the virtual environment:**
   ```bash
   source .venv/bin/activate
   ```
   You should see `(.venv)` in your terminal prompt.

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Or create a `.env` file manually in the `portal_backend` directory.

6. **Edit `.env` file with your Fineract settings:**
   ```bash
   nano .env
   ```
   Or use any text editor. Add these variables:
   ```
   MIFOS_BASE_URL=https://localhost:8443/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=mifos
   MIFOS_ADMIN_PASS=password
   MIFOS_VERIFY_SSL=false
   MIFOS_CLIENT_ID=3
   DJANGO_SECRET_KEY=dev-secret-key-change-me
   DEBUG=true
   ```

   **Important:** Update these values to match your Fineract instance:
   - `MIFOS_BASE_URL`: Your Fineract API URL
   - `MIFOS_ADMIN_USER`: Your Fineract admin username
   - `MIFOS_ADMIN_PASS`: Your Fineract admin password
   - `MIFOS_CLIENT_ID`: The client ID you want to use for the portal

7. **Run database migrations (if needed):**
   ```bash
   python manage.py migrate
   ```

8. **Start the Django backend server:**
   ```bash
   python manage.py runserver 8000
   ```
   The backend will be available at `http://localhost:8000`

## Step 4: Verify Setup

1. **Frontend:** Open `http://localhost:4200` in your browser
2. **Backend:** Test the health endpoint:
   ```bash
   curl http://localhost:8000/dashboard
   ```
   Should return: `{"status": "ok"}`

3. **Test login:**
   - Go to `http://localhost:4200/#/clientportal/login`
   - Username: `client`
   - Password: `password`

## Troubleshooting

### Backend won't start

**Error: `ModuleNotFoundError: No module named 'rest_framework'`**
- Make sure you activated the virtual environment: `source .venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

**Error: `Port 8000 already in use`**
- Use a different port: `python manage.py runserver 8001`
- Or find and kill the process using port 8000:
  ```bash
  lsof -ti:8000 | xargs kill -9
  ```

### Frontend can't connect to backend

- Check that backend is running on `http://localhost:8000`
- Check browser console for CORS errors
- Verify `djangoApiUrl` in `src/environments/environment.ts` is set to `http://localhost:8000`

### SSL Certificate Warnings

If you see `InsecureRequestWarning` in the backend logs, this is normal when `MIFOS_VERIFY_SSL=false`. You can ignore these warnings in development.

## Quick Start Commands Summary

```bash
# Terminal 1: Frontend
cd /path/to/mifos-main/Mifos
npm install --legacy-peer-deps
ng serve

# Terminal 2: Backend
cd /path/to/mifos-main/Mifos/portal_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Edit .env file with your settings
python manage.py runserver 8000
```

## Notes

- Keep both terminals open (one for frontend, one for backend)
- The virtual environment needs to be activated each time you open a new terminal
- If you close the terminal, you'll need to reactivate the venv: `source .venv/bin/activate`

