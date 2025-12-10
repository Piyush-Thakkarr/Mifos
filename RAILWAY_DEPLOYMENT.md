# Railway Deployment Guide

This guide will help you deploy both the Angular frontend and Django backend to Railway.

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app (free $5 credit/month)
2. **GitHub Account**: Your code should be on GitHub
3. **Railway CLI** (optional): Install with `npm i -g @railway/cli` or use the web dashboard

---

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select your repository
5. Railway will create a new project

---

## Step 2: Deploy Django Backend

### 2.1 Create Backend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (select the same repo)
3. Railway will auto-detect it as a Python project

### 2.2 Configure Backend Service

1. **Service Name**: `client-portal-backend`
2. **Root Directory**: Set to `portal_backend`
3. **Build Command**: Railway will auto-detect, but you can set:
   ```
   pip install -r requirements.txt
   ```
4. **Start Command**: 
   ```
   gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
   ```

### 2.3 Set Environment Variables (Backend)

Go to **Variables** tab and add:

```bash
# Python Version
PYTHON_VERSION=3.11.0

# Django Settings
DJANGO_SECRET_KEY=<generate-a-secret-key>
DEBUG=false

# Fineract Configuration (Using Public Server)
MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_VERIFY_SSL=true
MIFOS_CLIENT_ID=3

# Frontend URL (will be set after frontend deploys)
FRONTEND_URL=<will-be-set-after-frontend-deploys>
CORS_ALLOWED_ORIGINS=<will-be-set-after-frontend-deploys>
```

**Note**: After frontend deploys, update `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` with the frontend URL.

### 2.4 Generate Secret Key

Run this command to generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## Step 3: Deploy Angular Frontend

### 3.1 Create Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (select the same repo)
3. Railway will auto-detect it as a Node.js project

### 3.2 Configure Frontend Service

1. **Service Name**: `client-portal-frontend`
2. **Root Directory**: Leave as root (`.`)
3. **Build Command**: Railway will auto-detect, but you can set:
   ```bash
   chmod +x build-frontend.sh && ./build-frontend.sh
   ```
   Or manually:
   ```bash
   npm install --legacy-peer-deps && npm run build
   ```
4. **Start Command**: 
   ```bash
   npx serve -s dist/web-app/browser -l $PORT
   ```

### 3.3 Set Environment Variables (Frontend)

Go to **Variables** tab and add:

```bash
# Node Version
NODE_VERSION=20

# Django Backend URL (use the backend service URL from Railway)
DJANGO_API_URL=<backend-railway-url>

# Fineract API URL (for main Mifos app)
FINERACT_API_URL=https://demo.mifos.io
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default

# OAuth (disabled)
MIFOS_OAUTH_SERVER_ENABLED=false
MIFOS_OAUTH_SERVER_URL=
MIFOS_OAUTH_CLIENT_ID=
```

**Important**: 
- Replace `<backend-railway-url>` with your backend service's Railway URL (e.g., `https://client-portal-backend-production.up.railway.app`)
- You'll get this URL after the backend service deploys

---

## Step 4: Update CORS Settings

After both services are deployed:

1. Go to **Backend Service** → **Variables**
2. Update `FRONTEND_URL` with your frontend Railway URL
3. Update `CORS_ALLOWED_ORIGINS` with your frontend Railway URL
4. Railway will automatically redeploy the backend

---

## Step 5: Deploy

Railway will automatically deploy when you:
- Push to your connected branch (usually `main` or `dev`)
- Or manually trigger a deploy from the Railway dashboard

---

## Step 6: Get Your URLs

1. Go to each service in Railway
2. Click on the service
3. Go to **Settings** → **Generate Domain**
4. Railway will give you a URL like: `https://client-portal-frontend-production.up.railway.app`

---

## Environment Variables Quick Reference

### Backend Variables:
```
PYTHON_VERSION=3.11.0
DJANGO_SECRET_KEY=<your-secret-key>
DEBUG=false
MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_VERIFY_SSL=true
MIFOS_CLIENT_ID=3
FRONTEND_URL=<frontend-railway-url>
CORS_ALLOWED_ORIGINS=<frontend-railway-url>
```

### Frontend Variables:
```
NODE_VERSION=20
DJANGO_API_URL=<backend-railway-url>
FINERACT_API_URL=https://demo.mifos.io
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
MIFOS_OAUTH_SERVER_ENABLED=false
```

---

## Troubleshooting

### Backend Issues:
- **Port Error**: Make sure start command uses `$PORT` (Railway provides this)
- **Static Files**: Railway handles static files automatically
- **Database**: If you need a database, Railway provides PostgreSQL (add as a service)

### Frontend Issues:
- **Build Fails**: Check Node version (should be 20)
- **env.js not generated**: Make sure `build-frontend.sh` is executable
- **CORS Errors**: Update `CORS_ALLOWED_ORIGINS` in backend with frontend URL

### General:
- **Logs**: Check Railway dashboard → Service → **Deployments** → Click on deployment → **View Logs**
- **Redeploy**: Go to service → **Deployments** → Click **"Redeploy"**

---

## Railway vs Render

- **Railway**: $5 free credit/month, no pipeline minute limits, easier setup
- **Render**: 750 free hours/month, pipeline minute limits, more configuration options

Both work great! You can use both simultaneously for redundancy.

---

## Next Steps

1. Deploy backend first
2. Get backend URL
3. Deploy frontend with backend URL
4. Update backend CORS settings with frontend URL
5. Test both services!

Good luck! 🚀

