# Railway Quick Start Guide

## 🚀 Quick Setup Steps

### 1. Sign Up & Create Project

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository

### 2. Deploy Backend First

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. **Settings**:
   - **Name**: `client-portal-backend`
   - **Root Directory**: `portal_backend`
   - **Build Command**: (auto-detected, or use: `pip install -r requirements.txt`)
   - **Start Command**: `gunicorn portal_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

3. **Variables** (Settings → Variables):

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
   FRONTEND_URL=<set-after-frontend-deploys>
   CORS_ALLOWED_ORIGINS=<set-after-frontend-deploys>
   ```

4. **Generate Domain**: Settings → Generate Domain (copy this URL)

### 3. Deploy Frontend

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. **Settings**:
   - **Name**: `client-portal-frontend`
   - **Root Directory**: `.` (root)
   - **Build Command**: `chmod +x build-frontend.sh && ./build-frontend.sh`
   - **Start Command**: `npx serve -s dist/web-app/browser -l $PORT`

3. **Variables** (Settings → Variables):

   ```
   NODE_VERSION=20
   DJANGO_API_URL=<backend-railway-url-from-step-2>
   FINERACT_API_URL=https://demo.mifos.io
   FINERACT_API_PROVIDER=/fineract-provider/api
   FINERACT_API_VERSION=/v1
   FINERACT_PLATFORM_TENANT_IDENTIFIER=default
   MIFOS_OAUTH_SERVER_ENABLED=false
   ```

4. **Generate Domain**: Settings → Generate Domain (copy this URL)

### 4. Update Backend CORS

1. Go back to **Backend Service** → **Variables**
2. Update:
   - `FRONTEND_URL` = your frontend Railway URL
   - `CORS_ALLOWED_ORIGINS` = your frontend Railway URL
3. Backend will auto-redeploy

### 5. Test!

- Frontend URL: Your frontend service URL
- Backend URL: Your backend service URL
- Test login with `mifos`/`password` (main app) or `client`/`password` (client portal)

---

## 🔑 Generate Secret Key

Run this to generate `DJANGO_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Or use any random long string.

---

## 📝 Important Notes

- Railway auto-deploys on every push to your connected branch
- Check logs in Railway dashboard if something fails
- Both services get free $5 credit/month
- No pipeline minute limits!

---

## 🆘 Troubleshooting

**Backend won't start?**

- Check logs in Railway dashboard
- Make sure `$PORT` is used in start command
- Verify all environment variables are set

**Frontend build fails?**

- Check Node version (should be 20)
- Make sure `build-frontend.sh` is executable
- Check logs for specific error

**CORS errors?**

- Make sure `CORS_ALLOWED_ORIGINS` in backend matches frontend URL exactly
- Include `https://` in the URL

---

That's it! Your app should be live on Railway! 🎉
