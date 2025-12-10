# Backend 500 Error - Debugging Guide

## The Problem
Client Portal login returns 500 Internal Server Error from Django backend.

## Most Common Causes

### 1. Backend Can't Connect to Fineract
**Check in Render Dashboard → Backend Service → Logs:**
- Look for `upstream_unavailable` or `503` errors
- Check if `MIFOS_BASE_URL` is correct

**Fix:**
- Verify `MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1`
- Make sure URL has `/fineract-provider/api/v1` at the end

### 2. Wrong Fineract Credentials
**Check in Render Dashboard → Backend Service → Logs:**
- Look for `401` or `Authentication failed` errors

**Fix:**
- Verify `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS` are correct for demo.mifos.io
- Try: `mifos` / `password` (common demo credentials)
- Or check https://demo.mifos.io for current credentials

### 3. Missing Environment Variables
**Check in Render Dashboard → Backend Service → Environment:**
- All these must be set:
  - `PYTHON_VERSION=3.11.0`
  - `DEBUG=false`
  - `MIFOS_BASE_URL=https://demo.mifos.io/fineract-provider/api/v1`
  - `MIFOS_TENANT_ID=default`
  - `MIFOS_ADMIN_USER=mifos`
  - `MIFOS_ADMIN_PASS=password`
  - `MIFOS_VERIFY_SSL=true`
  - `MIFOS_CLIENT_ID=3`

### 4. Backend Build Failed
**Check in Render Dashboard → Backend Service → Logs:**
- Look for build errors
- Check if `requirements.txt` installed correctly

**Fix:**
- Check build logs for errors
- Verify `portal_backend/requirements.txt` exists

## Quick Test

Test backend directly:
```bash
curl -X POST https://your-backend-url.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"password"}'
```

Expected: `{"success": true, ...}`
If 500: Check backend logs for error details

## Steps to Debug

1. **Go to Render Dashboard**
2. **Click on your backend service** (`client-portal-backend`)
3. **Click "Logs" tab**
4. **Look for the error message** when you try to login
5. **Common errors:**
   - `upstream_unavailable` → Fineract connection issue
   - `ModuleNotFoundError` → Missing Python package
   - `Authentication failed` → Wrong Fineract credentials
   - `Connection refused` → Wrong Fineract URL

## Fix Checklist

- [ ] Backend service is running (not sleeping)
- [ ] All environment variables are set
- [ ] `MIFOS_BASE_URL` is correct (full path with `/fineract-provider/api/v1`)
- [ ] `MIFOS_ADMIN_USER` and `MIFOS_ADMIN_PASS` are correct
- [ ] `MIFOS_VERIFY_SSL=true` (for public servers)
- [ ] Backend logs show no errors on startup
- [ ] Test backend health endpoint works

