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

6. **Create `.env` file:**

   ```bash
   nano .env
   ```

   Or use any text editor.

   **If Fineract is on YOUR machine (localhost):**

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

   **If Fineract is on your TEAMMATE's machine (same network):**

   ```
   MIFOS_BASE_URL=https://TEAMMATE_IP:8443/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=mifos
   MIFOS_ADMIN_PASS=password
   MIFOS_VERIFY_SSL=false
   MIFOS_CLIENT_ID=3
   DJANGO_SECRET_KEY=dev-secret-key-change-me
   DEBUG=true
   ```

   Replace `TEAMMATE_IP` with your teammate's IP address (e.g., `10.20.16.106`)

   **Important:** Always set `MIFOS_VERIFY_SSL=false` for local development with self-signed certificates.

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

### "upstream_unavailable" Error on Login

This error means the Django backend can't connect to Fineract. This happens when Fineract is running on a different machine.

**Solution 1: If Fineract is running on your teammate's machine (same network)**

1. **Find your teammate's local IP address:**
   - On Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - On Windows: `ipconfig` (look for IPv4 Address)
   - Example: `192.168.1.100`

2. **Update `.env` file on your machine:**

   ```bash
   nano portal_backend/.env
   ```

   Change these lines:

   ```
   MIFOS_BASE_URL=https://YOUR_TEAMMATE_IP:8443/fineract-provider/api/v1
   MIFOS_VERIFY_SSL=false
   ```

   Replace `YOUR_TEAMMATE_IP` with the actual IP (e.g., `192.168.1.100`)

   **Important:** Set `MIFOS_VERIFY_SSL=false` because Fineract uses self-signed SSL certificates.

3. **Restart the Django server (IMPORTANT - must restart after .env changes):**

   ```bash
   # Stop the server (Ctrl+C), then restart
   python manage.py runserver 8000
   ```

4. **Verify the connection:**
   Check the Django server logs when you try to login. You should see connection attempts to Fineract.

**Solution 2: If Fineract is running in Docker on your teammate's machine**

1. Make sure Docker exposes port 8443 to the network (not just localhost)
2. Use your teammate's IP address as in Solution 1

**Solution 3: Run Fineract on your own machine**

If you need Fineract running locally:

- Follow the Fineract setup instructions
- Or use Docker: `docker compose -f docker-compose-development.yml up -d`
- Keep `MIFOS_BASE_URL=https://localhost:8443/fineract-provider/api/v1` in `.env`

**Solution 4: Use a remote Fineract instance**

If you have access to a remote Fineract server:

```
MIFOS_BASE_URL=https://your-fineract-server.com/fineract-provider/api/v1
```

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
# Create .env file with team's Fineract settings (see step 6 above)
python manage.py runserver 8000
```

## Notes

- Keep both terminals open (one for frontend, one for backend)
- The virtual environment needs to be activated each time you open a new terminal
- If you close the terminal, you'll need to reactivate the venv: `source .venv/bin/activate`
