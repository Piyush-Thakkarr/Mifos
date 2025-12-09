# Complete Render Deployment Guide - With Your Own Fineract

This guide provides step-by-step instructions for deploying the entire Client Portal application stack on Render, including your own Fineract Docker instance.

## Architecture Overview

The deployment consists of:
1. **PostgreSQL Database** - For Fineract data storage
2. **Fineract Backend** - Core banking engine (Docker container)
3. **Django Backend** - Python web service (middleware)
4. **Angular Frontend** - Static web service

## Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
   - **Starter Plan Required** ($7/month) for Docker support (Fineract deployment)
   - Free tier for Django and Angular services
2. **GitHub Repository** - Your code should be in a GitHub repository

## Deployment Steps

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing this project
5. Render will detect `render.yaml` automatically

### Step 2: Review Services

Render will show all services from `render.yaml`:
- **fineract-database** - PostgreSQL database
- **fineract-backend** - Fineract Docker service (requires Starter plan)
- **client-portal-backend** - Django backend
- **client-portal-frontend** - Angular frontend

### Step 3: Configure Environment Variables

#### For fineract-backend Service:

The database connection is auto-configured, but you may need to set:

- `FINERACT_DEFAULT_TENANTDB_NAME`: `fineract_default` (default tenant database name)

#### For client-portal-backend Service:

**Required Variables:**
- `MIFOS_ADMIN_USER`: Your Fineract admin username (default: `mifos`)
- `MIFOS_ADMIN_PASS`: Your Fineract admin password (default: `password`)
- `MIFOS_CLIENT_ID`: The client ID you want to use for the portal (default: `3`)

**Auto-configured:**
- `MIFOS_BASE_URL`: Automatically points to your Fineract service
- `FRONTEND_URL`: Automatically set from frontend service
- `CORS_ALLOWED_ORIGINS`: Automatically set from frontend service

#### For client-portal-frontend Service:

All variables are auto-configured from other services.

### Step 4: Deploy

1. Click "Apply" to deploy all services
2. **Deployment Order:**
   - Database deploys first
   - Fineract deploys second (waits for database)
   - Django backend deploys third
   - Angular frontend deploys last

3. **Wait Times:**
   - Database: ~2 minutes
   - Fineract: ~5-10 minutes (first deployment takes longer)
   - Django: ~3-5 minutes
   - Angular: ~5-8 minutes

### Step 5: Initialize Fineract

After Fineract is deployed:

1. **Wait for Fineract to be healthy:**
   - Check Fineract service logs in Render
   - Look for: "Started FineractApplication" or similar
   - Health check: `https://your-fineract-service.onrender.com/fineract-provider/actuator/health`

2. **Access Fineract UI:**
   - URL: `https://your-fineract-service.onrender.com`
   - Accept the self-signed SSL certificate warning
   - Login with:
     - Username: `mifos` (or your admin user)
     - Password: `password` (or your admin password)
     - Tenant: `default`

3. **Create Initial Data:**
   - Create a tenant (if not exists)
   - Create users
   - Create a client (note the Client ID)
   - Create loan products
   - Create savings products
   - Create test loans and savings accounts

4. **Update Client ID:**
   - In Render dashboard, go to **client-portal-backend** service
   - Go to "Environment" tab
   - Update `MIFOS_CLIENT_ID` to match your created client
   - Save and redeploy backend

### Step 6: Test the Deployment

1. **Frontend URL**: `https://your-frontend-service.onrender.com`
2. **Backend URL**: `https://your-backend-service.onrender.com`
3. **Fineract URL**: `https://your-fineract-service.onrender.com`

4. **Test Login:**
   - Go to frontend URL
   - Click "Client Portal Login"
   - Username: `client`
   - Password: `password`

## Manual Service Creation (Alternative)

If you prefer to create services manually:

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `fineract-database`
   - **Database**: `fineract_tenants`
   - **User**: `fineract_user`
   - **Plan**: Free
3. Note the connection details

### 2. Create Fineract Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `fineract-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./fineract/Dockerfile`
   - **Docker Context**: `./fineract`
   - **Plan**: Starter ($7/month) - Required for Docker
4. Add environment variables (see Step 3 above)
5. Deploy

### 3. Create Django Backend Service

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
4. Add environment variables (see Step 3 above)
5. Deploy

### 4. Create Angular Frontend Service

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
4. Add environment variables (see Step 3 above)
5. Deploy

## Environment Variables Reference

### Fineract Service Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | Auto-set from database |
| `DATABASE_PORT` | PostgreSQL port | Auto-set from database |
| `DATABASE_NAME` | Database name | `fineract_tenants` |
| `DATABASE_USER` | Database user | Auto-set from database |
| `DATABASE_PASSWORD` | Database password | Auto-set from database |
| `FINERACT_HIKARI_JDBC_URL` | JDBC connection URL | Auto-configured |
| `FINERACT_DEFAULT_TENANTDB_NAME` | Default tenant DB | `fineract_default` |

### Backend (Django) Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MIFOS_BASE_URL` | Fineract API URL | Auto-set from Fineract service |
| `MIFOS_TENANT_ID` | Fineract tenant | `default` |
| `MIFOS_ADMIN_USER` | Fineract admin username | `mifos` |
| `MIFOS_ADMIN_PASS` | Fineract admin password | `password` |
| `MIFOS_CLIENT_ID` | Client ID for portal | `3` |
| `MIFOS_VERIFY_SSL` | Verify SSL | `false` (for self-signed certs) |
| `FRONTEND_URL` | Frontend URL | Auto-set from frontend service |

### Frontend (Angular) Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DJANGO_API_URL` | Django backend URL | Auto-set from backend service |
| `FINERACT_API_URL` | Fineract URL | Auto-set from Fineract service |
| `FINERACT_PLATFORM_TENANT_IDENTIFIER` | Tenant ID | `default` |

## Troubleshooting

### Fineract Issues

**Fineract won't start:**
- Check database connection in Fineract logs
- Verify database credentials are correct
- Ensure database is accessible from Fineract service
- Check if database has been initialized

**Fineract health check fails:**
- Wait 5-10 minutes for Fineract to fully start
- Check logs for Java errors
- Verify port 8443 is exposed correctly
- Check if SSL certificate is being generated

**Database connection errors:**
- Verify `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` are correct
- Check database user has proper permissions
- Ensure database service is running

### Backend Issues

**503 Upstream Unavailable:**
- Check `MIFOS_BASE_URL` points to correct Fineract service
- Verify Fineract is running and healthy
- Check `MIFOS_VERIFY_SSL` is set to `false` for self-signed certs
- Test Fineract connection manually

**CORS Errors:**
- Ensure `FRONTEND_URL` is set correctly
- Check `CORS_ALLOWED_ORIGINS` includes frontend URL
- Verify CORS middleware is enabled

### Frontend Issues

**Build Failures:**
- Check Node.js version (should be 20.x)
- Verify `build-frontend.sh` has execute permissions
- Check for npm dependency issues

**API Connection Errors:**
- Verify `DJANGO_API_URL` is set correctly
- Check backend service is running
- Verify CORS is configured on backend

## Important Notes

1. **Starter Plan Required**: Fineract Docker deployment requires Render's Starter plan ($7/month)
2. **SSL Certificates**: Fineract uses self-signed certificates - set `MIFOS_VERIFY_SSL=false` in backend
3. **First Deployment**: Fineract takes 5-10 minutes to start on first deployment
4. **Database Initialization**: Fineract will create necessary tables on first start
5. **Free Tier Limitations**: Free tier services spin down after 15 minutes of inactivity
6. **Port Configuration**: Render uses `$PORT` environment variable - Fineract Dockerfile handles this

## Post-Deployment Checklist

- [ ] All services are running and healthy
- [ ] Fineract database is initialized
- [ ] Fineract UI is accessible
- [ ] Fineract admin user can login
- [ ] Test client created in Fineract
- [ ] Client ID updated in backend config
- [ ] Backend can connect to Fineract (check logs)
- [ ] Frontend can connect to backend (test login)
- [ ] CORS is configured correctly
- [ ] All environment variables are set correctly

## Cost Estimation

- **PostgreSQL Database**: Free (with limitations)
- **Fineract (Docker)**: Starter plan - $7/month (required)
- **Django Backend**: Free (with limitations)
- **Angular Frontend**: Free (with limitations)

**Total**: ~$7/month (for Fineract Docker support)

## Support

For issues:
1. Check Render service logs
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test Fineract connection independently
5. Check Fineract health endpoint: `/fineract-provider/actuator/health`

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL certificates (auto-handled by Render)
3. Set up monitoring and alerts
4. Configure database backups
5. Set up CI/CD for automatic deployments
6. Create production Fineract data (tenants, users, products, clients)
