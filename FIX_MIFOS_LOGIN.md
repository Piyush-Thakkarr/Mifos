# Fix: Main Mifos Login 401 Error

## Problem

The main Mifos login page shows a 401 (Unauthorized) error when trying to login with `mifos` / `password` credentials.

## Root Cause

The `FINERACT_API_URL` environment variable is not set in Render for the frontend service, causing it to default to `https://localhost:8443` which doesn't exist on Render.

## Solution

### Step 1: Set Environment Variable in Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Navigate to your frontend service**: `client-portal-frontend`
3. **Click on "Environment" tab**
4. **Add/Update this environment variable:**

   ```
   FINERACT_API_URL=https://demo.mifos.io
   ```

   ⚠️ **Important**: Use `https://demo.mifos.io` (without `/fineract-provider/api/v1`)

5. **Click "Save Changes"**
6. **Redeploy the service** (or it will auto-redeploy)

### Step 2: Verify Other Environment Variables

Make sure these are also set in the frontend service:

```
FINERACT_API_PROVIDER=/fineract-provider/api
FINERACT_API_VERSION=/v1
FINERACT_PLATFORM_TENANT_IDENTIFIER=default
DJANGO_API_URL=https://your-backend-url.onrender.com
```

### Step 3: Test Login

After redeployment, try logging in with:

- **Username**: `mifos`
- **Password**: `password`
- **Tenant**: `default`

## Why This Happens

The `render.yaml` file marks `FINERACT_API_URL` as `sync: false`, which means it must be set manually in Render's dashboard. This is intentional because:

- Different deployments might use different Fineract servers
- The URL might change between environments
- It prevents accidentally overwriting custom configurations

## Verification

After setting the environment variable and redeploying, check the browser console:

- The error should be gone
- Login should work with `mifos` / `password`
- The app should connect to `https://demo.mifos.io/fineract-provider/api/v1`

## Alternative: Update render.yaml (Not Recommended)

If you want to set it in `render.yaml` instead, change:

```yaml
- key: FINERACT_API_URL
  sync: false # Set manually: https://demo.mifos.io
```

To:

```yaml
- key: FINERACT_API_URL
  value: https://demo.mifos.io
```

But this is less flexible for different environments.
