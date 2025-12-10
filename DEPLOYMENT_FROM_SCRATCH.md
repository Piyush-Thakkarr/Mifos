# 🚀 Client Portal Deployment Guide - From Scratch

## Overview

This guide will help you deploy the Client Portal to Render:
- **Backend**: Django API (Web Service on Render)
- **Frontend**: Angular App (Static Site on Render)
- **Fineract**: Public Fineract server (e.g., demo.mifos.io)

---

## Prerequisites

✅ Render account (free tier works)  
✅ Git repository with your code  
✅ Public Fineract server URL (see below)  
✅ Fineract admin credentials (for public server)

---

## Public Fineract Servers

You can use these public Fineract servers for testing:

### Option 1: Mifos Demo Server (Recommended)
- **URL**: `https://demo.mifos.io`
- **Full API URL**: `https://demo.mifos.io/fineract-provider/api/v1`
- **Tenant ID**: `default`
- **Credentials**: You may need to register or use demo credentials
- **Note**: Check https://demo.mifos.io for current credentials

### Option 2: Mifos Development Server
- **URL**: `https://fineract.dev.mifos.io`
- **Full API URL**: `https://fineract.dev.mifos.io/fineract-provider/api/v1`
- **Tenant ID**: `default`
- **Credentials**: Check Mifos documentation for current credentials

### Option 3: Your Own Public Fineract Server
- Use your own deployed Fineract instance URL
- Ensure it's publicly accessible
- Ensure CORS is configured to allow your frontend domain  

---

## Step 1: Prepare Your Repository

### 1.1 Verify Files Are Present

Make sure these files exist in your repo:

```
Mifos/
├── render.yaml                    # Deployment config (updated)
├── build-frontend.sh              # Frontend build script
├── portal_backend/
│   ├── requirements.txt           # Python dependencies
│   ├── manage.py
│   └── portal_backend/
│       └── settings.py            # Django settings
└── src/
    └── assets/
        └── env.template.js        # Environment template
```

### 1.2 Commit and Push to Git

```bash
cd Mifos
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Deploy Backend (Django API)

### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect your Git repository**
4. **Configure the service:**

   - **Name**: `client-portal-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your branch)
   - **Root Directory**: Leave empty (or `Mifos` if repo root is parent)
   - **Build Command**:
     ```bash
     cd portal_backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```bash
     cd portal_backend && gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
     ```
   - **Plan**: Free

5. **Add Environment Variables:**

   Click "Advanced" → "Add Environment Variable" and add:

   ```
   PYTHON_VERSION=3.11.0
   DEBUG=false
   MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=mifos
   MIFOS_ADMIN_PASS=password
   MIFOS_VERIFY_SSL=true
   MIFOS_CLIENT_ID=3
   ```

   **⚠️ Important**: 
   - Replace with your public Fineract server URL (e.g., `https://demo.mifos.io/fineract-provider/api/v1`)
   - Update `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS` with valid credentials for the public server
   - Set `MIFOS_VERIFY_SSL=true` for public servers (they have valid SSL certificates)
   - You may need to create a test client in the public Fineract server and update `MIFOS_CLIENT_ID` accordingly

6. **Click "Create Web Service"**

7. **Wait for deployment** (2-5 minutes)

8. **Copy the service URL** (e.g., `https://client-portal-backend-xxxx.onrender.com`)

---

### Option B: Using Blueprint (render.yaml)

1. **Go to Render Dashboard**
2. **Click "New +" → "Blueprint"**
3. **Connect your repository**
4. **Render will detect `render.yaml`**
5. **Before deploying, update environment variables:**
   - Go to the backend service settings
   - Set `MIFOS_BASE_URL` to your Fineract URL
   - Set `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS`
6. **Click "Apply"**

---

## Step 3: Deploy Frontend (Angular Static Site)

1. **Go to Render Dashboard**
2. **Click "New +" → "Static Site"**
3. **Connect your Git repository**
4. **Configure:**

   - **Name**: `client-portal-frontend`
   - **Branch**: `main` (or your branch)
   - **Root Directory**: Leave empty (or `Mifos` if repo root is parent)
   - **Build Command**:
     ```bash
     chmod +x build-frontend.sh && ./build-frontend.sh
     ```
   - **Publish Directory**: `dist/web-app/browser`
   - **Node Version**: `20.x`

5. **Add Environment Variables:**

   ```
   NODE_VERSION=20.x
   DJANGO_API_URL=https://client-portal-backend-xxxx.onrender.com
   FINERACT_API_URL=https://demo.mifos.io
   FINERACT_API_PROVIDER=/fineract-provider/api
   FINERACT_API_VERSION=/v1
   FINERACT_PLATFORM_TENANT_IDENTIFIER=default
   ```

   **⚠️ Important**: 
   - Replace `client-portal-backend-xxxx` with your actual backend URL from Step 2
   - Replace `https://demo.mifos.io` with your public Fineract server URL (without `/fineract-provider/api/v1`)

6. **Click "Create Static Site"**

7. **Wait for deployment** (5-10 minutes for first build)

8. **Copy the frontend URL** (e.g., `https://client-portal-frontend-xxxx.onrender.com`)

---

## Step 4: Update Backend CORS Settings

After frontend is deployed, update backend to allow frontend requests:

1. **Go to backend service** (`client-portal-backend`)
2. **Go to "Environment" tab**
3. **Update these variables:**

   ```
   FRONTEND_URL=https://client-portal-frontend-xxxx.onrender.com
   CORS_ALLOWED_ORIGINS=https://client-portal-frontend-xxxx.onrender.com
   ```

   (Replace with your actual frontend URL)

4. **Click "Save Changes"**
5. **Render will auto-redeploy** (or click "Manual Deploy")

---

## Step 5: Verify Deployment

### 5.1 Test Backend

1. **Visit**: `https://your-backend-url.onrender.com/auth/login`
2. **Expected**: Should return JSON (not HTML error)
3. **Test with curl**:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"client","password":"password"}'
   ```
   Should return `{"success": true, ...}`

### 5.2 Test Frontend

1. **Visit**: `https://your-frontend-url.onrender.com`
2. **Expected**: Mifos login page should load
3. **Click "Client Portal Login"**
4. **Login with**: `client` / `password`
5. **Expected**: Dashboard should load with data

### 5.3 Test Client Portal

1. **Login to client portal**
2. **Check dashboard loads** (profile, loans, savings, transactions)
3. **Navigate to different pages** (Loans, Transactions, Notifications, Support)
4. **Verify data is loading** from Fineract

---

## Troubleshooting

### Backend Issues

#### ❌ Build Fails: "ModuleNotFoundError"
**Solution**: Check `requirements.txt` has all dependencies. Verify Python version is 3.11.0.

#### ❌ 503 Upstream Unavailable
**Solution**: 
- Check `MIFOS_BASE_URL` is correct (should be full URL: `https://demo.mifos.io/fineract-provider/api/v1`)
- Verify public Fineract server is accessible (try opening URL in browser)
- Check `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS` are correct for the public server
- For public servers, set `MIFOS_VERIFY_SSL=true` (they have valid SSL certificates)
- Verify the public server allows API access (some may require registration)

#### ❌ CORS Errors
**Solution**:
- Verify `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` match frontend URL exactly
- Check backend logs for CORS errors
- Ensure frontend URL has `https://` protocol

### Frontend Issues

#### ❌ Build Fails: "npm error code ERESOLVE"
**Solution**: `.npmrc` file should have `legacy-peer-deps=true`. Verify it's in the repo.

#### ❌ 404 on Routes
**Solution**: 
- Check `Publish Directory` is exactly `dist/web-app/browser`
- Verify build completed successfully
- Check build logs for errors

#### ❌ API Calls Fail
**Solution**:
- Check `DJANGO_API_URL` environment variable is set correctly
- Verify backend is running and accessible
- Check browser console for CORS errors
- Ensure `DJANGO_API_URL` has `https://` protocol

#### ❌ Blank Page / White Screen
**Solution**:
- Check browser console for JavaScript errors
- Verify `env.js` is generated correctly (check build logs)
- Check network tab for failed requests

---

## Environment Variables Reference

### Backend (Django)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PYTHON_VERSION` | Yes | `3.11.0` | Python version |
| `DJANGO_SECRET_KEY` | Yes | Auto-generated | Django secret key |
| `DEBUG` | Yes | `false` | Debug mode (false for production) |
| `MIFOS_BASE_URL` | Yes | `https://demo.mifos.io/fineract-provider/api/v1` | Public Fineract API URL (full path) |
| `MIFOS_TENANT_ID` | Yes | `default` | Fineract tenant ID |
| `MIFOS_ADMIN_USER` | Yes | `mifos` | Public Fineract admin username |
| `MIFOS_ADMIN_PASS` | Yes | `password` | Public Fineract admin password |
| `MIFOS_VERIFY_SSL` | Yes | `true` | Verify SSL certificates (true for public servers) |
| `MIFOS_CLIENT_ID` | Yes | `3` | Client ID for portal |
| `FRONTEND_URL` | Yes | `https://frontend.onrender.com` | Frontend URL for CORS |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://frontend.onrender.com` | Allowed CORS origins |

### Frontend (Angular)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_VERSION` | Yes | `20.x` | Node.js version |
| `DJANGO_API_URL` | Yes | `https://backend.onrender.com` | Django backend URL |
| `FINERACT_API_URL` | Yes | `https://demo.mifos.io` | Public Fineract server URL (base URL only) |
| `FINERACT_API_PROVIDER` | Yes | `/fineract-provider/api` | Fineract API provider path |
| `FINERACT_API_VERSION` | Yes | `/v1` | Fineract API version |
| `FINERACT_PLATFORM_TENANT_IDENTIFIER` | Yes | `default` | Fineract tenant identifier |

---

## Quick Deployment Checklist

- [ ] Repository is pushed to Git
- [ ] Backend service created on Render
- [ ] Backend environment variables set (especially `MIFOS_BASE_URL`)
- [ ] Backend deployed successfully
- [ ] Frontend service created on Render
- [ ] Frontend environment variables set (especially `DJANGO_API_URL` and `FINERACT_API_URL`)
- [ ] Frontend deployed successfully
- [ ] Backend CORS settings updated with frontend URL
- [ ] Backend redeployed after CORS update
- [ ] Tested backend health endpoint
- [ ] Tested frontend loads
- [ ] Tested client portal login
- [ ] Tested dashboard loads data

---

## Post-Deployment

### Monitor Logs

- **Backend**: Render Dashboard → Backend Service → "Logs" tab
- **Frontend**: Render Dashboard → Frontend Service → "Logs" tab

### Update URLs

If you get custom domains:
1. Update `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in backend
2. Update `DJANGO_API_URL` in frontend
3. Redeploy both services

### Scaling

- **Free tier**: Services sleep after 15 minutes of inactivity
- **Starter tier**: Services stay awake 24/7
- **Upgrade**: Render Dashboard → Service → "Settings" → "Plan"

---

## Support

If you encounter issues:
1. Check Render logs (Dashboard → Service → Logs)
2. Check browser console (F12 → Console)
3. Verify all environment variables are set correctly
4. Ensure Fineract is running and accessible
5. Test backend health endpoint directly

---

## Notes

- ✅ **Using Public Fineract Server** - No need to deploy Fineract, use public server (e.g., demo.mifos.io)
- ✅ **Backend and Frontend are separate services** - Deploy them separately
- ✅ **CORS must be configured** - Update backend after frontend deploys
- ✅ **Environment variables are critical** - Double-check all URLs
- ✅ **First build takes longer** - Be patient (5-10 minutes)
- ⚠️ **Public Server Credentials** - You may need to register or obtain credentials for the public Fineract server
- ⚠️ **Client ID** - Create a test client in the public Fineract server and update `MIFOS_CLIENT_ID` accordingly
- ⚠️ **SSL Verification** - Set `MIFOS_VERIFY_SSL=true` for public servers (they have valid certificates)

