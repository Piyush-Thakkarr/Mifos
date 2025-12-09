# CORS Fix for Render Deployment

## Issue
CORS errors when frontend (mifos-1.onrender.com) tries to access backend (mifos-1-backend.onrender.com).

## Solution Applied

1. **Updated Django CORS Settings:**
   - Added regex pattern to allow all `.onrender.com` subdomains
   - Enhanced CORS headers to include all necessary headers
   - Added explicit CORS handling in login endpoint

2. **Environment Variables to Set in Render Backend:**
   
   **Option 1: Set FRONTEND_URL (Recommended)**
   ```
   FRONTEND_URL=https://mifos-1.onrender.com
   ```

   **Option 2: Set CORS_ALLOWED_ORIGINS**
   ```
   CORS_ALLOWED_ORIGINS=https://mifos-1.onrender.com
   ```

   **Option 3: Let regex handle it (Current setup)**
   - The backend now automatically allows any `.onrender.com` subdomain
   - No additional env vars needed if both services are on Render

## Verification

After deploying, check:
1. Backend logs show CORS headers in responses
2. Browser console shows no CORS errors
3. Login request succeeds

## Manual Test

```bash
# Test CORS preflight
curl -X OPTIONS https://mifos-1-backend.onrender.com/auth/login \
  -H "Origin: https://mifos-1.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return 200 with CORS headers
```

