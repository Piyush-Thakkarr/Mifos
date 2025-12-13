# Cloudflare Tunnel Setup for Local Fineract

This guide sets up Cloudflare Tunnel to expose your local Fineract server (running on `localhost:8443`) to the internet, so your deployed backend can access it.

## Prerequisites

- Cloudflare account (free tier works)
- `cloudflared` installed (already installed on your system)

## Step 1: Login to Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Select the domain you want to use (or create a free one at Cloudflare).

## Step 2: Create a Tunnel

```bash
cloudflared tunnel create fineract-tunnel
```

This creates a tunnel named `fineract-tunnel` and saves the credentials.

## Step 3: Create Tunnel Configuration

Create a config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: fineract-tunnel
credentials-file: /Users/piyus/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: fineract.yourdomain.com # Replace with your domain
    service: https://localhost:8443
    originRequest:
      noTLSVerify: true # Important: Fineract uses self-signed cert
  - service: http_status:404
```

**Important:** Replace `fineract.yourdomain.com` with your actual Cloudflare domain (e.g., `fineract.example.com`).

## Step 4: Create DNS Record

```bash
cloudflared tunnel route dns fineract-tunnel fineract.yourdomain.com
```

Replace `fineract.yourdomain.com` with your actual subdomain.

## Step 5: Run the Tunnel

```bash
cloudflared tunnel run fineract-tunnel
```

Or run it in the background:

```bash
cloudflared tunnel run fineract-tunnel &
```

## Step 6: Update Backend Configuration

Once the tunnel is running, you'll get a public URL like: `https://fineract.yourdomain.com`

Update your backend environment variables:

### For Railway/Render Deployment:

Set these environment variables:

```bash
MIFOS_BASE_URL=https://fineract.yourdomain.com
MIFOS_VERIFY_SSL=false  # Cloudflare handles SSL, but Fineract uses self-signed cert
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_CLIENT_ID=1
```

### For Local Development:

Update `Mifos/portal_backend/.env`:

```bash
MIFOS_BASE_URL=https://fineract.yourdomain.com
MIFOS_VERIFY_SSL=false
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_CLIENT_ID=1
```

## Step 7: Keep Tunnel Running

To keep the tunnel running permanently, you can:

### Option A: Run in Background (Simple)

```bash
nohup cloudflared tunnel run fineract-tunnel > /tmp/cloudflared.log 2>&1 &
```

### Option B: Create a Launch Agent (macOS - Recommended)

Create `~/Library/LaunchAgents/com.cloudflare.tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>fineract-tunnel</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cloudflared.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cloudflared.error.log</string>
</dict>
</plist>
```

Then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.plist
```

## Quick Start (Simplified)

If you just want to test quickly without a custom domain:

```bash
# This gives you a random URL like: https://random-name.trycloudflare.com
cloudflared tunnel --url https://localhost:8443 --no-tls-verify
```

Use the URL it provides in your backend configuration.

## Troubleshooting

1. **Tunnel not connecting**: Make sure Fineract is running (`docker ps`)
2. **SSL errors**: Set `MIFOS_VERIFY_SSL=false` in backend
3. **Connection refused**: Check that Fineract is on port 8443
4. **Tunnel dies**: Use the Launch Agent method to keep it running

## Testing

Test the tunnel URL:

```bash
curl -k https://fineract.yourdomain.com/fineract-provider/api/v1/authentication
```

You should get a response (even if it's an error, that means it's working).
