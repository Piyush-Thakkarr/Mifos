# Railway Deployment Guide - Complete Step-by-Step Instructions

This is a **comprehensive, detailed guide** that explains every single step, click, and setting when deploying to Railway.

---

## Table of Contents
1. [Understanding Railway Configuration Files](#understanding-railway-configuration-files)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Railway Account and Project](#step-1-create-railway-account-and-project)
4. [Step 2: Deploy Django Backend (Detailed)](#step-2-deploy-django-backend-detailed)
5. [Step 3: Deploy Angular Frontend (Detailed)](#step-3-deploy-angular-frontend-detailed)
6. [Step 4: Connect Frontend and Backend](#step-4-connect-frontend-and-backend)
7. [Step 5: Testing Your Deployment](#step-5-testing-your-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Understanding Railway Configuration Files

Before we start, let's understand what the `railway.json` files do:

### What is `railway.json`?

Railway uses configuration files to understand how to build and run your application. We have two files:

1. **`railway.json`** (in root) - For the Angular frontend
2. **`portal_backend/railway.json`** - For the Django backend

### Understanding the Configuration Structure

Let's break down what each part means:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "..."
  },
  "deploy": {
    "startCommand": "...",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `$schema`
- **What it is**: A reference to Railway's configuration schema
- **What it does**: Helps your editor provide autocomplete and validation
- **You don't need to change this**: It's just metadata

#### `build` Section
- **What it is**: Tells Railway how to prepare your application for deployment
- **When it runs**: Every time Railway builds your app (before deploying)

##### `builder: "NIXPACKS"` or `"Dockerfile"`
- **What it is**: The build system Railway uses
- **Railway has 3 builder options**:
  1. **NIXPACKS** (Recommended for our setup)
     - Automatically detects your project type (Node.js, Python, etc.)
     - Installs the right runtime (Node.js 20, Python 3.11, etc.)
     - Sets up the environment automatically
     - **Best for**: Simple deployments, when you don't have a Dockerfile
  2. **Dockerfile** (What Railway might auto-detect)
     - Uses a Dockerfile in your repository
     - More control, but more complex
     - **Best for**: Complex deployments, when you already have a Dockerfile
  3. **Docker Compose** (Not used here)
     - For multi-container setups

- **What you might see in Railway**:
  - If Railway finds a `Dockerfile` in your repo, it will show: **"Dockerfile Automatically Detected"**
  - If no Dockerfile, it will use: **"NIXPACKS"**

- **For our setup**:
  - **Backend**: Should use **NIXPACKS** (we don't have a Dockerfile for backend)
  - **Frontend**: Can use either **NIXPACKS** or **Dockerfile** (you have a Dockerfile, but NIXPACKS is simpler)

- **How to change the builder**:
  - Go to Service → Settings → Build section
  - Click on "Builder" dropdown
  - Select "NIXPACKS" or "Dockerfile" as needed

##### `buildCommand`
- **What it is**: The exact command Railway runs to build your app
- **When it runs**: During the build phase, after NIXPACKS sets up the environment
- **For Frontend**: `chmod +x build-frontend.sh && ./build-frontend.sh`
  - `chmod +x` makes the script executable
  - `./build-frontend.sh` runs the build script
- **For Backend**: `pip install -r requirements.txt`
  - Installs all Python dependencies from `requirements.txt`

#### `deploy` Section
- **What it is**: Tells Railway how to run your application
- **When it runs**: After a successful build, to start your app

##### `startCommand`
- **What it is**: The command that starts your application
- **What `$PORT` means**: Railway automatically provides a port number via the `$PORT` environment variable
- **For Frontend**: `npx serve -s dist/web-app/browser -l $PORT`
  - `npx serve` - Serves static files
  - `-s` - Single-page app mode (handles routing)
  - `dist/web-app/browser` - Where Angular builds the files
  - `-l $PORT` - Listen on Railway's provided port
- **For Backend**: `gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
  - `gunicorn` - Python web server
  - `portal_backend.wsgi:application` - Your Django app
  - `--bind 0.0.0.0:$PORT` - Listen on all interfaces on Railway's port
  - `--workers 2` - Use 2 worker processes
  - `--timeout 120` - Request timeout of 120 seconds

##### `restartPolicyType: "ON_FAILURE"`
- **What it is**: When Railway should restart your app
- **What it means**: Only restart if the app crashes/fails
- **Alternative**: `"ALWAYS"` (restart always) or `"NEVER"` (never restart)

##### `restartPolicyMaxRetries: 10`
- **What it is**: Maximum number of restart attempts
- **What it means**: If your app keeps failing, Railway will try to restart it up to 10 times
- **After 10 failures**: Railway will stop trying and mark the deployment as failed

---

## Prerequisites

Before starting, make sure you have:

1. **GitHub Account**: Your code must be on GitHub
   - If not, push your code to GitHub first
   - Railway connects to GitHub to deploy

2. **Railway Account**: Sign up at https://railway.app
   - Free tier includes $5 credit/month
   - No credit card required for free tier

3. **Your Code**: Make sure your code is pushed to GitHub
   - Railway will pull from GitHub
   - Make sure `railway.json` files are committed

---

## Step 1: Create Railway Account and Project

### 1.1 Sign Up for Railway

1. **Open your web browser**
2. **Go to**: https://railway.app
3. **Click the "Start a New Project" button** (usually big and prominent)
4. **You'll see options**:
   - "Login with GitHub" (recommended)
   - "Login with Email"
5. **Click "Login with GitHub"**
   - This connects Railway to your GitHub account
   - Railway needs this to access your repositories
6. **Authorize Railway**:
   - GitHub will ask you to authorize Railway
   - Click "Authorize Railway" or "Authorize"
   - You may need to enter your GitHub password

### 1.2 Create a New Project

After logging in, you'll see the Railway dashboard:

1. **Look for a button that says**:
   - "New Project" (usually top right or center)
   - Or "+ New" button
2. **Click "New Project"**
3. **You'll see options**:
   - "Deploy from GitHub repo" (this is what we want)
   - "Empty Project"
   - "Deploy a Template"
4. **Click "Deploy from GitHub repo"**
5. **Select your repository**:
   - Railway will show a list of your GitHub repositories
   - **Find and click on your Mifos repository**
   - It might be named something like `Mifos` or `mifos-main`
6. **Railway will create a project**:
   - It will automatically detect your repository
   - You'll see a loading screen
   - Railway is setting up the project

### 1.3 Railway Auto-Detection (What Just Happened!)

**IMPORTANT**: Railway is smart! When you connect a repository, it can automatically:

1. **Detect multiple services** in your repo (if you have `railway.json` files or a monorepo structure)
2. **Auto-create services** for each detected service
3. **Auto-detect the builder** (Dockerfile, NIXPACKS, etc.)

**What you might see**:
- Railway automatically created **2 services**:
  - `client-portal-backend` (for Django)
  - `client-portal-frontend` (for Angular)
- Both services are already building!

**This is normal and good!** Railway detected your `railway.json` files and created the services automatically.

**However**, you still need to:
1. Configure each service (Root Directory, Builder, Start Command)
2. Set environment variables
3. Generate domains

**If Railway didn't auto-create services**, don't worry - we'll show you how to create them manually in Step 2.

### 1.4 Understanding the Railway Dashboard

After the project is created, you'll see:

- **Project Name**: At the top (you can rename it)
- **Services**: List of services (might already have 2 services if auto-detected!)
- **Settings**: Project settings
- **Variables**: Environment variables (project-wide)
- **Deployments**: History of deployments

**Important**: A Railway "Project" can contain multiple "Services". We need 2 services:
1. Backend service (Django) - should be named `client-portal-backend`
2. Frontend service (Angular) - should be named `client-portal-frontend`

**If services are already created**: Great! Skip to Step 2.2 to configure them.
**If services are NOT created**: Follow Step 2.1 to create them manually.

---

## Step 2: Deploy Django Backend (Detailed)

### 2.1 Create the Backend Service (If Not Auto-Created)

**Check first**: Look at your Railway dashboard. Do you already see a service called `client-portal-backend`?

- **If YES**: Great! Railway auto-created it. Skip to **Step 2.2** to configure it.
- **If NO**: Follow the steps below to create it manually.

**To create manually**:

1. **In your Railway project dashboard**, look for:
   - A button that says **"+ New"** (usually top right)
   - Or **"Add Service"**
2. **Click "+ New"**
3. **You'll see a dropdown menu with options**:
   - "GitHub Repo"
   - "Database" (PostgreSQL, MySQL, etc.)
   - "Empty Service"
   - "Template"
4. **Click "GitHub Repo"**
5. **Select your repository again**:
   - Railway will show your repositories
   - **Click on the same repository** (Mifos)
6. **Railway will create a new service**:
   - It will try to auto-detect the project type
   - You might see it detecting "Python" or "Django"
   - This is normal!

### 2.2 Configure the Backend Service

After the service is created, you'll see the service dashboard. Now we need to configure it:

#### 2.2.1 Set the Service Name

1. **Look at the top of the service page**
2. **You'll see the service name** (might be auto-generated like "web" or "service-1")
3. **Click on the name** (or look for an edit icon)
4. **Change it to**: `client-portal-backend`
5. **Press Enter** or click outside to save

#### 2.2.2 Set the Root Directory

The root directory tells Railway where your backend code is located:

1. **Click on the "Settings" tab** (usually at the top of the service page)
2. **Scroll down to find "Root Directory"** (or "Source" section)
3. **You'll see a text field** (might be empty or say ".")
4. **Type**: `portal_backend`
   - This tells Railway: "The backend code is in the `portal_backend` folder"
5. **Click "Save"** or the changes auto-save

#### 2.2.3 Configure Build Settings

1. **Still in the "Settings" tab**
2. **Scroll down to find "Build" section**
3. **You'll see the "Builder" field**:
   - It might say **"Dockerfile Automatically Detected"** (if Railway found a Dockerfile)
   - OR it might say **"NIXPACKS"**
   - OR it might be empty

4. **Change the Builder to NIXPACKS** (Important for backend!):
   - **Click on the "Builder" dropdown**
   - **Select "NIXPACKS"** from the list
   - **Why**: The backend doesn't have a Dockerfile in `portal_backend/`, so we need NIXPACKS
   - **What this does**: Uses Railway's smart auto-detection for Python/Django

5. **For "Build Command"** (recommended):
   - **Click in the "Build Command" field** (or "Custom Build Command")
   - **Type**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **What this does**: 
     - Installs Python dependencies
     - Collects Django static files for WhiteNoise to serve (required for production)
   - **Breakdown**:
     - `pip install -r requirements.txt` - Installs all Python packages
     - `&&` - Runs next command only if first succeeds
     - `python manage.py collectstatic --noinput` - Collects static files (no prompts)
   - **Note**: The `collectstatic` is important because your backend uses WhiteNoise to serve static files

6. **For "Dockerfile Path"** (if shown):
   - **Leave this empty** or ignore it (we're using NIXPACKS, not Dockerfile)
   - If you see this field, it's because Railway detected a Dockerfile in the root, but we don't want to use it for the backend

7. **Click "Save"** or changes auto-save

#### 2.2.4 Configure Start Command

1. **Still in "Settings" tab**
2. **Look for "Start Command"** or "Deploy" section
3. **You'll see a text field for "Start Command"**
4. **Type exactly**:
   ```
   gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
   ```
5. **Breakdown of this command**:
   - `gunicorn` - The web server that runs Django
   - `portal_backend.wsgi:application` - Points to your Django app
   - `--bind 0.0.0.0:$PORT` - Listen on Railway's port (0.0.0.0 means all network interfaces)
   - `--workers 2` - Use 2 worker processes (handles 2 requests simultaneously)
   - `--timeout 120` - If a request takes longer than 120 seconds, cancel it
6. **Click "Save"** if there's a save button

### 2.3 Set Environment Variables (Backend)

Environment variables are configuration values your app needs. Railway stores them securely.

1. **Click on the "Variables" tab** (next to "Settings")
2. **You'll see a table or list** (might be empty)
3. **Look for a button**:
   - "+ New Variable"
   - "+ Add Variable"
   - Or a "+" icon
4. **Click to add a new variable**

Now add each variable one by one. For each variable:

1. **Click "+ New Variable"**
2. **In "Key" field**: Type the variable name (e.g., `PYTHON_VERSION`)
3. **In "Value" field**: Type the value (e.g., `3.11.0`)
4. **Click "Add"** or "Save"
5. **Repeat for each variable**

#### Variables to Add (Backend):

**1. PYTHON_VERSION**
- **Key**: `PYTHON_VERSION`
- **Value**: `3.11.0`
- **What it does**: Tells Railway which Python version to use

**2. DJANGO_SECRET_KEY**
- **Key**: `DJANGO_SECRET_KEY`
- **Value**: Generate a random string (see below)
- **What it does**: Django uses this to encrypt sessions and cookies
- **How to generate**:
  - Open your terminal
  - Run: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
  - Copy the output
  - Paste it as the value
  - **OR** use any long random string (at least 50 characters)

**3. DEBUG**
- **Key**: `DEBUG`
- **Value**: `false`
- **What it does**: Disables Django's debug mode (important for production)

**4. MIFOS_BASE_URL**
- **Key**: `MIFOS_BASE_URL`
- **Value**: `https://demo.mifos.io/fineract-provider/api/v1`
- **What it does**: The Fineract API endpoint your backend connects to

**5. MIFOS_TENANT_ID**
- **Key**: `MIFOS_TENANT_ID`
- **Value**: `default`
- **What it does**: The tenant identifier for Fineract

**6. MIFOS_ADMIN_USER**
- **Key**: `MIFOS_ADMIN_USER`
- **Value**: `mifos`
- **What it does**: Username for Fineract API authentication

**7. MIFOS_ADMIN_PASS**
- **Key**: `MIFOS_ADMIN_PASS`
- **Value**: `password`
- **What it does**: Password for Fineract API authentication

**8. MIFOS_VERIFY_SSL**
- **Key**: `MIFOS_VERIFY_SSL`
- **Value**: `true`
- **What it does**: Verify SSL certificates when connecting to Fineract

**9. MIFOS_CLIENT_ID**
- **Key**: `MIFOS_CLIENT_ID`
- **Value**: `3`
- **What it does**: The client ID for the client portal (which client to show data for)

**10. FRONTEND_URL** (Set this later!)
- **Key**: `FRONTEND_URL`
- **Value**: `https://your-frontend-url.up.railway.app` (we'll set this after frontend deploys)
- **What it does**: Tells backend where the frontend is hosted (for CORS)

**11. CORS_ALLOWED_ORIGINS** (Set this later!)
- **Key**: `CORS_ALLOWED_ORIGINS`
- **Value**: `https://your-frontend-url.up.railway.app` (same as FRONTEND_URL)
- **What it does**: Allows the frontend to make requests to the backend

**Note**: For variables 10 and 11, you can add them now with placeholder values, or add them after the frontend is deployed. We'll update them in Step 4.

### 2.4 Generate a Domain for Backend

Railway gives each service a URL so you can access it:

1. **Click on the "Settings" tab** again
2. **Look for "Domains" section** or "Generate Domain"
3. **You'll see**:
   - "Generate Domain" button
   - Or "Custom Domain" section
4. **Click "Generate Domain"**
5. **Railway will create a URL** like:
   - `https://client-portal-backend-production-xxxx.up.railway.app`
6. **Copy this URL** - You'll need it for the frontend!
7. **Save it somewhere** (notepad, notes app, etc.)

### 2.5 Deploy the Backend

Now let's trigger the first deployment:

1. **Go back to the service dashboard** (click on the service name in the sidebar)
2. **Look for "Deployments" tab**
3. **You'll see**:
   - A list of deployments (might be empty)
   - Or "No deployments yet"
4. **Railway might auto-deploy**, or you can:
   - Click "Redeploy" button
   - Or push a commit to GitHub (Railway auto-deploys on push)
5. **Watch the deployment**:
   - You'll see build logs
   - It will show: "Building...", "Deploying...", "Success"
   - This might take 2-5 minutes

### 2.6 Verify Backend Deployment

1. **Wait for deployment to finish** (status should be "Active" or "Success")
2. **Click on the deployment** to see logs
3. **Check for errors**:
   - If you see "Build failed" or red errors, check the logs
   - Common issues: Missing environment variables, wrong Python version
4. **Test the backend URL**:
   - Open the backend URL in a browser
   - You might see an error page (that's OK - it means it's running!)
   - Or you might see Django's default page

**If deployment fails**: Check the "Troubleshooting" section at the end of this guide.

---

## Step 3: Deploy Angular Frontend (Detailed)

### 3.1 Create the Frontend Service (If Not Auto-Created)

**Check first**: Look at your Railway dashboard. Do you already see a service called `client-portal-frontend`?

- **If YES**: Great! Railway auto-created it. Skip to **Step 3.2** to configure it.
- **If NO**: Follow the steps below to create it manually.

**To create manually**:

1. **Go back to your Railway project dashboard** (click project name in sidebar)
2. **Click "+ New"** again
3. **Click "GitHub Repo"**
4. **Select the same repository** (Mifos)
5. **Railway will create another service**

### 3.2 Configure the Frontend Service

#### 3.2.1 Set the Service Name

1. **Click on the service name** (might be "web" or "service-2")
2. **Change it to**: `client-portal-frontend`
3. **Press Enter** to save

#### 3.2.2 Set the Root Directory

1. **Click "Settings" tab**
2. **Find "Root Directory"**
3. **Leave it as** `.` (dot means root directory)
   - OR explicitly set it to `.`
   - This tells Railway: "The frontend code is in the root folder"
4. **Click "Save"**

#### 3.2.3 Configure Build Settings

1. **Still in "Settings" tab**
2. **Scroll down to find "Build" section**
3. **You'll see the "Builder" field**:
   - It might say **"Dockerfile Automatically Detected"** (Railway found your root Dockerfile)
   - OR it might say **"NIXPACKS"**
   
4. **IMPORTANT: Change to NIXPACKS** (Required!):
   - **Click on the "Builder" dropdown**
   - **Select "NIXPACKS"** (NOT Dockerfile!)
   - **Why**: Your Dockerfile uses nginx, but Railway's start command uses `npx serve`. They conflict!
   - **NIXPACKS** will use the start command from `railway.json` which works correctly
   
5. **For "Build Command"**:
   - **Click in the "Build Command" field** (or "Custom Build Command")
   - **Type**:
     ```
     chmod +x build-frontend.sh && ./build-frontend.sh
     ```
   - **Breakdown**:
     - `chmod +x build-frontend.sh` - Makes the build script executable
     - `&&` - Runs the next command only if the first succeeds
     - `./build-frontend.sh` - Runs the build script
   - **Alternative** (if script doesn't work):
     ```
     npm install --legacy-peer-deps && npm run build
     ```
   
6. **Click "Save"** or changes auto-save

**Note**: If you see "Container failed to start - The executable `npx` could not be found", it means Railway is still using the Dockerfile. Make sure you selected "NIXPACKS" as the builder!

#### 3.2.4 Configure Start Command

1. **Still in "Settings" tab**
2. **Find "Start Command"**
3. **Type exactly**:
   ```
   npx serve -s dist/web-app/browser -l $PORT
   ```
4. **Breakdown**:
   - `npx serve` - Serves static files (Angular builds to static files)
   - `-s` - Single-page app mode (handles client-side routing)
   - `dist/web-app/browser` - Where Angular puts the built files
   - `-l $PORT` - Listen on Railway's port
5. **Click "Save"**

### 3.3 Set Environment Variables (Frontend)

1. **Click "Variables" tab**
2. **Click "+ New Variable"** for each variable

#### Variables to Add (Frontend):

**1. NODE_VERSION**
- **Key**: `NODE_VERSION`
- **Value**: `20`
- **What it does**: Tells Railway to use Node.js version 20

**2. DJANGO_API_URL**
- **Key**: `DJANGO_API_URL`
- **Value**: `https://your-backend-url.up.railway.app` (use the backend URL from Step 2.4!)
- **What it does**: Tells frontend where the backend API is
- **Important**: Replace `your-backend-url` with the actual backend URL you copied!

**3. FINERACT_API_URL**
- **Key**: `FINERACT_API_URL`
- **Value**: `https://demo.mifos.io`
- **What it does**: Base URL for Fineract API (for main Mifos app, not client portal)

**4. FINERACT_API_PROVIDER**
- **Key**: `FINERACT_API_PROVIDER`
- **Value**: `/fineract-provider/api`
- **What it does**: API path for Fineract

**5. FINERACT_API_VERSION**
- **Key**: `FINERACT_API_VERSION`
- **Value**: `/v1`
- **What it does**: API version for Fineract

**6. FINERACT_PLATFORM_TENANT_IDENTIFIER**
- **Key**: `FINERACT_PLATFORM_TENANT_IDENTIFIER`
- **Value**: `default`
- **What it does**: Tenant identifier for Fineract

**7. MIFOS_OAUTH_SERVER_ENABLED**
- **Key**: `MIFOS_OAUTH_SERVER_ENABLED`
- **Value**: `false`
- **What it does**: Disables OAuth (we're using basic auth)

**8. MIFOS_OAUTH_SERVER_URL** (Optional)
- **Key**: `MIFOS_OAUTH_SERVER_URL`
- **Value**: (leave empty or don't add this variable)
- **What it does**: OAuth server URL (not needed since OAuth is disabled)

**9. MIFOS_OAUTH_CLIENT_ID** (Optional)
- **Key**: `MIFOS_OAUTH_CLIENT_ID`
- **Value**: (leave empty or don't add this variable)
- **What it does**: OAuth client ID (not needed)

### 3.4 Generate a Domain for Frontend

1. **Click "Settings" tab**
2. **Find "Domains" section**
3. **Click "Generate Domain"**
4. **Railway will create a URL** like:
   - `https://client-portal-frontend-production-xxxx.up.railway.app`
5. **Copy this URL** - You'll need it to update backend CORS settings!

### 3.5 Deploy the Frontend

1. **Go to "Deployments" tab**
2. **Railway might auto-deploy**, or click "Redeploy"
3. **Watch the deployment**:
   - Building Angular can take 5-10 minutes (it's a large app)
   - You'll see npm install, then Angular build
   - Wait for "Success" status

### 3.6 Verify Frontend Deployment

1. **Wait for deployment to finish**
2. **Check logs for errors**
3. **Open the frontend URL in a browser**
4. **You should see**:
   - The Mifos login page (main app)
   - Or the client portal login page
   - If you see a page (even with errors), the deployment worked!

---

## Step 4: Connect Frontend and Backend

Now we need to tell the backend where the frontend is (for CORS):

### 4.1 Update Backend CORS Settings

1. **Go back to your Railway project**
2. **Click on the backend service** (`client-portal-backend`)
3. **Click "Variables" tab**
4. **Find these variables**:
   - `FRONTEND_URL`
   - `CORS_ALLOWED_ORIGINS`
5. **Update their values**:
   - **FRONTEND_URL**: Set to your frontend Railway URL (from Step 3.4)
   - **CORS_ALLOWED_ORIGINS**: Set to the same frontend URL
   - Example: `https://client-portal-frontend-production-xxxx.up.railway.app`
6. **Click "Save"** (or changes auto-save)
7. **Railway will automatically redeploy the backend** with new settings

### 4.2 Wait for Backend Redeploy

1. **Go to "Deployments" tab** in backend service
2. **Wait for the new deployment to finish**
3. **Status should be "Active"**

---

## Step 5: Testing Your Deployment

### 5.1 Test Main Mifos Login

1. **Open your frontend URL** in a browser
2. **You should see the Mifos login page**
3. **Try logging in with**:
   - Username: `mifos`
   - Password: `password`
4. **If login works**: Great! Main app is working.

### 5.2 Test Client Portal

1. **Navigate to**: `https://your-frontend-url/clientportal/login`
2. **Or look for a "Client Portal" link** on the main page
3. **Try logging in with**:
   - Username: `client` (or the client username you set up)
   - Password: `password`
4. **If login works**: Great! Client portal is working.

### 5.3 Check for Errors

1. **Open browser developer tools** (F12 or Right-click → Inspect)
2. **Go to "Console" tab**
3. **Look for red errors**:
   - CORS errors: Backend CORS not configured correctly
   - 404 errors: Frontend can't find backend
   - 500 errors: Backend has an issue

---

## Troubleshooting

### Backend Won't Start

**Problem**: Backend deployment fails or shows errors

**Solutions**:
1. **Check logs**:
   - Go to service → Deployments → Click on deployment → View logs
   - Look for red error messages
2. **Common issues**:
   - **Missing environment variables**: Make sure all variables are set
   - **Wrong Python version**: Check `PYTHON_VERSION=3.11.0`
   - **Port error**: Make sure start command uses `$PORT`
   - **Gunicorn not found**: Make sure `gunicorn` is in `requirements.txt`

### Frontend Build Fails

**Problem**: Frontend deployment fails during build

**Solutions**:
1. **Check build logs** for specific errors
2. **Common issues**:
   - **Node version**: Make sure `NODE_VERSION=20`
   - **npm install fails**: Try changing build command to:
     ```
     npm install --legacy-peer-deps && npm run build
     ```
   - **Build script not executable**: The `chmod +x` in build command should fix this
   - **Out of memory**: Railway free tier has limits, but Angular should build fine

### CORS Errors

**Problem**: Browser console shows CORS errors

**Solutions**:
1. **Check backend variables**:
   - `FRONTEND_URL` should match frontend Railway URL exactly
   - `CORS_ALLOWED_ORIGINS` should match frontend Railway URL exactly
   - Include `https://` in the URL
2. **Redeploy backend** after changing CORS variables
3. **Clear browser cache** and try again

### Frontend Can't Connect to Backend

**Problem**: Frontend shows "Cannot connect" or 404 errors

**Solutions**:
1. **Check `DJANGO_API_URL`** in frontend variables:
   - Should be the backend Railway URL
   - Should include `https://`
   - Should NOT have a trailing slash
2. **Test backend URL directly**:
   - Open backend URL in browser
   - Should see some response (even if it's an error page)
3. **Check backend is running**:
   - Go to backend service → Deployments
   - Status should be "Active"

### Environment Variables Not Working

**Problem**: App behaves as if variables aren't set

**Solutions**:
1. **Check variable names**: Must match exactly (case-sensitive)
2. **Redeploy after changing variables**: Railway auto-redeploys, but you can manually redeploy
3. **Check for typos**: `DJANGO_API_URL` not `DJANGO_API_URl`

### Build Takes Too Long

**Problem**: Build is taking forever

**Solutions**:
1. **This is normal**: Angular builds can take 5-10 minutes
2. **Check logs**: Make sure it's actually building (you'll see progress)
3. **If stuck**: Cancel and redeploy

### How to View Logs

1. **Go to service** (frontend or backend)
2. **Click "Deployments" tab**
3. **Click on a deployment** (latest one)
4. **You'll see build logs and runtime logs**
5. **Look for errors** (usually in red)

### How to Redeploy

1. **Go to service**
2. **Click "Deployments" tab**
3. **Click "Redeploy" button** (usually next to latest deployment)
4. **Or push a new commit to GitHub** (Railway auto-deploys)

---

## Quick Reference: All Environment Variables

### Backend Variables:
```
PYTHON_VERSION=3.11.0
DJANGO_SECRET_KEY=<generate-random-string>
DEBUG=false
MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_VERIFY_SSL=true
MIFOS_CLIENT_ID=3
FRONTEND_URL=https://your-frontend-url.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-url.up.railway.app
```

### Frontend Variables:
```
NODE_VERSION=20
DJANGO_API_URL=https://your-backend-url.up.railway.app
FINERACT_API_URL=https://demo.mifos.io
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
MIFOS_OAUTH_SERVER_ENABLED=false
```

---

## Summary

You've now:
1. ✅ Created a Railway account and project
2. ✅ Deployed the Django backend
3. ✅ Deployed the Angular frontend
4. ✅ Connected frontend and backend
5. ✅ Tested your deployment

Your app should now be live on Railway! 🎉

**Next Steps**:
- Monitor your Railway dashboard for usage
- Check logs if you encounter issues
- Railway auto-deploys on every GitHub push
- Free tier includes $5 credit/month

Good luck! 🚀
