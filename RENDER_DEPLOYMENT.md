# Render Deployment Guide

This guide explains how to deploy the Client Portal Self-Service Module to Render.

## Architecture

The application consists of two services:
1. **Backend (Django)**: API server running on Python
2. **Frontend (Angular)**: Static site served via Node.js

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Render CLI installed: `npm install -g render-cli`
3. Your GitHub repository connected to Render

## Deployment Steps

### Option 1: Using Render Dashboard (Recommended)

1. **Create Backend Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name**: `client-portal-backend`
     - **Environment**: `Python 3`
     - **Build Command**: 
       ```bash
       cd portal_backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
       ```
     - **Start Command**: 
       ```bash
       cd portal_backend && gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
       ```

2. **Set Environment Variables for Backend:**
   ```
   DJANGO_SECRET_KEY=<generate-a-secret-key>
   DEBUG=false
   MIFOS_BASE_URL=https://your-fineract-instance.com/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=your-admin-user
   MIFOS_ADMIN_PASS=your-admin-password
   MIFOS_VERIFY_SSL=true
   MIFOS_CLIENT_ID=3
   FRONTEND_URL=https://your-frontend-service.onrender.com
   ```

3. **Create Frontend Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect the same GitHub repository
   - Configure:
     - **Name**: `client-portal-frontend`
     - **Environment**: `Node`
     - **Build Command**: 
       ```bash
       npm ci && npm run build
       ```
     - **Start Command**: 
       ```bash
       npx serve -s dist/web-app/browser -l $PORT
       ```

4. **Set Environment Variables for Frontend:**
   ```
   NODE_VERSION=20.x
   DJANGO_API_URL=https://your-backend-service.onrender.com
   FINERACT_API_URL=https://your-fineract-instance.com
   FINERACT_PLATFORM_TENANT_IDENTIFIER=default
   ```

5. **Update Backend CORS:**
   - After frontend is deployed, update backend's `FRONTEND_URL` env var with the actual frontend URL

### Option 2: Using Render CLI

1. **Install Render CLI:**
   ```bash
   npm install -g render-cli
   ```

2. **Login to Render:**
   ```bash
   render login
   ```

3. **Deploy using render.yaml:**
   ```bash
   render deploy
   ```

4. **Set Environment Variables:**
   Use Render dashboard or CLI to set the required environment variables (see above)

## Environment Variables Reference

### Backend (Django)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Yes | Django secret key | `django-insecure-...` |
| `DEBUG` | Yes | Debug mode | `false` |
| `MIFOS_BASE_URL` | Yes | Fineract API base URL | `https://api.example.com/fineract-provider/api/v1` |
| `MIFOS_TENANT_ID` | Yes | Fineract tenant ID | `default` |
| `MIFOS_ADMIN_USER` | Yes | Fineract admin username | `mifos` |
| `MIFOS_ADMIN_PASS` | Yes | Fineract admin password | `password` |
| `MIFOS_VERIFY_SSL` | No | Verify SSL certificates | `true` |
| `MIFOS_CLIENT_ID` | Yes | Client ID for portal | `3` |
| `FRONTEND_URL` | Yes | Frontend service URL | `https://client-portal-frontend.onrender.com` |
| `DATABASE_URL` | Auto | PostgreSQL connection (auto-set by Render) | - |

### Frontend (Angular)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DJANGO_API_URL` | Yes | Backend API URL | `https://client-portal-backend.onrender.com` |
| `FINERACT_API_URL` | Yes | Fineract API URL | `https://api.example.com` |
| `FINERACT_PLATFORM_TENANT_IDENTIFIER` | Yes | Fineract tenant | `default` |

## Local Development

The application works locally without any changes:

### Backend:
```bash
cd portal_backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 8000
```

### Frontend:
```bash
npm install
npm start
```

The frontend will automatically use `http://localhost:8000` for the Django API.

## Post-Deployment Checklist

- [ ] Backend service is running and healthy
- [ ] Frontend service is running and accessible
- [ ] Backend CORS is configured with frontend URL
- [ ] Environment variables are set correctly
- [ ] Database migrations have run (if using PostgreSQL)
- [ ] Static files are being served correctly
- [ ] Test login functionality
- [ ] Test API endpoints from frontend

## Troubleshooting

### Backend Issues

1. **502 Bad Gateway**: Check if gunicorn is starting correctly
   - View logs: `render logs client-portal-backend`
   - Verify `startCommand` is correct

2. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in backend
   - Should be full URL: `https://your-frontend.onrender.com`
   - No trailing slash

3. **Database Errors**: If using PostgreSQL, ensure `DATABASE_URL` is set
   - Render automatically provides this for PostgreSQL databases

### Frontend Issues

1. **404 on Routes**: Ensure using `serve -s` flag for SPA routing
2. **API Connection Errors**: Verify `DJANGO_API_URL` is correct
3. **Build Failures**: Check Node version matches (20.x)

## Custom Domain

To use a custom domain:

1. Add domain in Render dashboard for each service
2. Update `ALLOWED_HOSTS` in backend settings (or use env var)
3. Update `FRONTEND_URL` in backend to match custom domain
4. Update `DJANGO_API_URL` in frontend to match custom backend domain

## Security Notes

- Never commit `.env` files
- Use strong `DJANGO_SECRET_KEY` in production
- Set `DEBUG=false` in production
- Use HTTPS (Render provides this automatically)
- Keep `MIFOS_ADMIN_PASS` secure

## Support

For issues:
1. Check Render service logs
2. Check application logs in Django
3. Verify environment variables
4. Test API endpoints directly

