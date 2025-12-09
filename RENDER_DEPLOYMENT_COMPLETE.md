# Complete Render Deployment Guide

This guide provides step-by-step instructions for deploying the entire Client Portal application stack on Render.

## Architecture Overview

The deployment consists of:
1. **Angular Frontend** - Static web service
2. **Django Backend** - Python web service (middleware)
3. **Fineract Backend** - Core banking engine (optional: use public sandbox or deploy your own)

## Option 1: Using Public Fineract Sandbox (Recommended for Testing)

This is the easiest option - use the public Fineract sandbox at `sandbox.mifos.community`.

### Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Repository** - Your code should be in a GitHub repository

### Deployment Steps

#### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing this project
5. Render will detect `render.yaml` automatically

#### Step 2: Review and Deploy

1. Render will show all services from `render.yaml`
2. Review the configuration:
   - **client-portal-backend** - Django backend
   - **client-portal-frontend** - Angular frontend
   - **fineract-database** - PostgreSQL (optional, for future Fineract deployment)

3. **Important Environment Variables to Set:**

   For **client-portal-backend** service:
   - `MIFOS_BASE_URL`: `https://sandbox.mifos.community/fineract-provider/api/v1` (already set)
   - `MIFOS_ADMIN_USER`: `mifos` (already set)
   - `MIFOS_ADMIN_PASS`: `password` (already set)
   - `MIFOS_CLIENT_ID`: `3` (or your client ID in the sandbox)

   For **client-portal-frontend** service:
   - `DJANGO_API_URL`: Auto-populated from backend service
   - `FINERACT_API_URL`: `https://sandbox.mifos.community` (already set)

4. Click "Apply" to deploy all services

#### Step 3: Create Test Client in Fineract Sandbox

1. Go to [Fineract Sandbox UI](https://sandbox.mifos.community)
2. Login with:
   - Username: `mifos`
   - Password: `password`
   - Tenant: `default`
3. Create a client (or use existing client ID `3`)
4. Create loans, savings accounts, and transactions for testing

#### Step 4: Update Client ID

1. In Render dashboard, go to **client-portal-backend** service
2. Go to "Environment" tab
3. Update `MIFOS_CLIENT_ID` to match your test client ID
4. Save and redeploy

### Testing the Deployment

1. **Frontend URL**: `https://your-frontend-service.onrender.com`
2. **Backend URL**: `https://your-backend-service.onrender.com`
3. **Test Login**:
   - Go to frontend URL
   - Click "Client Portal Login"
   - Username: `client`
   - Password: `password`

## Option 2: Deploy Your Own Fineract Instance

If you want to deploy Fineract on Render (requires paid plan for Docker support):

### Prerequisites

- Render **Starter Plan** or higher (for Docker support)
- Understanding of Fineract configuration

### Steps

1. **Uncomment Fineract Service** in `render.yaml`:
   ```yaml
   - type: web
     name: fineract-backend
     plan: starter
     # ... Fineract configuration
   ```

2. **Update Environment Variables**:
   - Set `MIFOS_BASE_URL` in backend to point to your Fineract service
   - Configure Fineract database connection

3. **Deploy**:
   - Render will build and deploy Fineract Docker container
   - Wait for Fineract to be healthy (may take 5-10 minutes)

4. **Initialize Fineract**:
   - Access Fineract UI
   - Create tenant, users, and test data

## Manual Service Creation (Alternative)

If you prefer to create services manually instead of using Blueprint:

### 1. Create Django Backend Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your repository
3. Configure:
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
4. Add environment variables (see Step 2 above)
5. Deploy

### 2. Create Angular Frontend Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `client-portal-frontend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     chmod +x build-frontend.sh && ./build-frontend.sh
     ```
   - **Start Command**: 
     ```bash
     npx serve -s dist/web-app/browser -l $PORT
     ```
4. Add environment variables:
   - `DJANGO_API_URL`: Your backend service URL
   - `FINERACT_API_URL`: Fineract URL
   - `NODE_VERSION`: `20.x`
5. Deploy

## Environment Variables Reference

### Backend (Django) Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MIFOS_BASE_URL` | Fineract API base URL | `https://sandbox.mifos.community/fineract-provider/api/v1` |
| `MIFOS_TENANT_ID` | Fineract tenant identifier | `default` |
| `MIFOS_ADMIN_USER` | Fineract admin username | `mifos` |
| `MIFOS_ADMIN_PASS` | Fineract admin password | `password` |
| `MIFOS_CLIENT_ID` | Client ID for portal | `3` |
| `MIFOS_VERIFY_SSL` | Verify SSL certificates | `true` or `false` |
| `FRONTEND_URL` | Frontend service URL (auto-set) | Auto-populated |
| `DJANGO_SECRET_KEY` | Django secret key | Auto-generated |

### Frontend (Angular) Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_API_URL` | Django backend URL | Auto-populated from backend service |
| `FINERACT_API_URL` | Fineract base URL | `https://sandbox.mifos.community` |
| `FINERACT_PLATFORM_TENANT_IDENTIFIER` | Tenant ID | `default` |
| `NODE_VERSION` | Node.js version | `20.x` |

## Troubleshooting

### Backend Issues

**503 Upstream Unavailable**
- Check `MIFOS_BASE_URL` is correct
- Verify Fineract is accessible
- Check `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS` are correct

**CORS Errors**
- Ensure `FRONTEND_URL` is set correctly
- Check `CORS_ALLOWED_ORIGINS` includes frontend URL

**Database Errors**
- If using PostgreSQL, check `DATABASE_URL` is set
- For SQLite (default), no database setup needed

### Frontend Issues

**Build Failures**
- Check Node.js version (should be 20.x)
- Verify `build-frontend.sh` has execute permissions
- Check for npm dependency issues

**API Connection Errors**
- Verify `DJANGO_API_URL` is set correctly
- Check backend service is running
- Verify CORS is configured on backend

### Fineract Issues

**Sandbox Access**
- Sandbox resets every 6 hours
- Create test data after each reset
- Use demo.mifos.community for more stable testing

**Custom Fineract Instance**
- Check Docker logs in Render
- Verify database connection
- Wait for Fineract to fully start (5-10 minutes)

## Post-Deployment Checklist

- [ ] Backend service is running and healthy
- [ ] Frontend service is running and accessible
- [ ] Backend can connect to Fineract (check logs)
- [ ] Frontend can connect to backend (test login)
- [ ] CORS is configured correctly
- [ ] Environment variables are set correctly
- [ ] Test client exists in Fineract
- [ ] Client ID matches in backend config

## Cost Estimation (Free Tier)

- **Django Backend**: Free (with limitations)
- **Angular Frontend**: Free (with limitations)
- **PostgreSQL Database**: Free (with limitations)
- **Fineract (Docker)**: Requires Starter plan ($7/month)

**Note**: Free tier services spin down after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.

## Support

For issues:
1. Check Render service logs
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test Fineract connection independently

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL certificates (auto-handled by Render)
3. Set up monitoring and alerts
4. Configure backups for database
5. Set up CI/CD for automatic deployments

