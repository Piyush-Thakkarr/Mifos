# Update Backend to Use Cloudflare Tunnel

Your Cloudflare Tunnel is running! Here's how to configure your backend to use it.

## Current Tunnel URL

**Public URL:** `https://jill-comparisons-elections-tobago.trycloudflare.com`

⚠️ **Note:** This URL changes each time you restart the tunnel. For a permanent URL, see the "Permanent Setup" section below.

## Step 1: Update Local Development (.env)

Update `Mifos/portal_backend/.env`:

```bash
MIFOS_BASE_URL=https://jill-comparisons-elections-tobago.trycloudflare.com/fineract-provider/api/v1
MIFOS_VERIFY_SSL=false
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_CLIENT_ID=1
```

## Step 2: Update Railway/Render Environment Variables

### Option A: Use CLOUDFLARE_TUNNEL_URL (Recommended)

The code now automatically detects the Cloudflare Tunnel URL! Just set:

```bash
CLOUDFLARE_TUNNEL_URL=https://jill-comparisons-elections-tobago.trycloudflare.com
```

The code will automatically add `/fineract-provider/api/v1` and set `MIFOS_VERIFY_SSL=false`.

### Option B: Use MIFOS_BASE_URL (Full Control)

If you prefer to set the full URL manually:

```bash
MIFOS_BASE_URL=https://jill-comparisons-elections-tobago.trycloudflare.com/fineract-provider/api/v1
MIFOS_VERIFY_SSL=false
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_CLIENT_ID=1
```

### For Railway:

1. Go to your Railway project
2. Select your **backend service**
3. Go to **Variables** tab
4. Add the variable (Option A or B above)
5. Click **Save** - Railway will automatically redeploy

### For Render:

1. Go to your Render dashboard
2. Select your **backend service**
3. Go to **Environment** tab
4. Add the variable (Option A or B above)
5. Click **Save Changes** - Render will automatically redeploy

## Step 3: Test the Connection

Test locally:

```bash
cd Mifos/portal_backend
python manage.py shell
```

Then in the shell:

```python
from mifos_client.client import MifosClient
client = MifosClient()
result = client.auth_check()
print(result)
```

Or test with curl:

```bash
curl -k https://jill-comparisons-elections-tobago.trycloudflare.com/fineract-provider/api/v1/authentication
```

## How Auto-Detection Works

The backend now automatically detects the Fineract URL in this order:

1. **`MIFOS_BASE_URL` environment variable** (highest priority - explicit override)
2. **`CLOUDFLARE_TUNNEL_URL` environment variable** (for deployed environments)
3. **`/tmp/cloudflared-url.txt` file** (for local development - auto-detected)
4. **Railway/Production**: Falls back to `demo.mifos.io` if tunnel not available
5. **Local Development**: **ERROR if tunnel not available** (no fallback to localhost)

This means:

- **Local**: **REQUIRES** Cloudflare Tunnel to be running. If not available, you'll get a clear error message.
- **Deployed**: Set `CLOUDFLARE_TUNNEL_URL` or `MIFOS_BASE_URL` in environment variables, or it falls back to `demo.mifos.io`

## Important Notes

### Tunnel URL Changes

⚠️ **The tunnel URL changes each time you restart it!**

If you restart the tunnel, you'll get a new URL. You'll need to:

1. Run `./start-cloudflare-tunnel.sh` again
2. Update `MIFOS_BASE_URL` with the new URL
3. Redeploy your backend

### Keep Tunnel Running

The tunnel must be running on your laptop for the backend to work. If your laptop goes to sleep or the tunnel stops, your backend won't be able to connect to Fineract.

To keep it running:

- Keep your laptop awake
- Or set up the tunnel as a service (see `CLOUDFLARE_TUNNEL_SETUP.md`)

### Permanent Setup (Optional)

For a permanent URL that doesn't change, set up a named tunnel with a custom domain:

1. Follow the "Permanent Setup" section in `CLOUDFLARE_TUNNEL_SETUP.md`
2. Use your custom domain in `MIFOS_BASE_URL`
3. The URL will stay the same even after restarts

## Troubleshooting

1. **"Cloudflare Tunnel is not available!" error**:
   - Start the tunnel: `cd Mifos && ./start-cloudflare-tunnel.sh`
   - Or set `MIFOS_BASE_URL` or `CLOUDFLARE_TUNNEL_URL` environment variable
   - Check if tunnel is running: `ps aux | grep cloudflared`
   - Check tunnel URL: `cat /tmp/cloudflared-url.txt`

2. **Backend can't connect**: Make sure the tunnel is running (`ps aux | grep cloudflared`)

3. **SSL errors**: Ensure `MIFOS_VERIFY_SSL=false` is set

4. **404 errors**: Make sure the URL includes `/fineract-provider/api/v1`

5. **Tunnel died**: Restart it with `./start-cloudflare-tunnel.sh`

## Quick Commands

```bash
# Start tunnel
./start-cloudflare-tunnel.sh

# Check if tunnel is running
ps aux | grep cloudflared

# Stop tunnel
kill $(cat /tmp/cloudflared-pid.txt)

# View tunnel URL
cat /tmp/cloudflared-url.txt
```
