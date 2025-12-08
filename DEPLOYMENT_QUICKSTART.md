# Quick Start: Render Deployment

## 🚀 Quick Deploy

### Using Render Dashboard:

1. **Backend Service:**
   - New → Web Service → Connect Repo
   - **Build**: `cd portal_backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start**: `cd portal_backend && gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Env Vars**: See below

2. **Frontend Service:**
   - New → Web Service → Connect Repo
   - **Build**: `chmod +x build-frontend.sh && ./build-frontend.sh`
   - **Start**: `npx serve -s dist/web-app/browser -l $PORT`
   - **Env Vars**: See below

### Using Render CLI:

```bash
render deploy
```

## 📋 Required Environment Variables

### Backend:
```
DJANGO_SECRET_KEY=<generate-secret>
DEBUG=false
MIFOS_BASE_URL=https://your-fineract.com/fineract-provider/api/v1
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=your-user
MIFOS_ADMIN_PASS=your-password
MIFOS_CLIENT_ID=3
FRONTEND_URL=https://your-frontend.onrender.com
```

### Frontend:
```
DJANGO_API_URL=https://your-backend.onrender.com
FINERACT_API_URL=https://your-fineract.com
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
```

## ✅ Local Development Still Works

No changes needed! Just run:
- Backend: `cd portal_backend && python manage.py runserver`
- Frontend: `npm start`

Everything works locally as before.

## 📖 Full Guide

See `RENDER_DEPLOYMENT.md` for detailed instructions.

