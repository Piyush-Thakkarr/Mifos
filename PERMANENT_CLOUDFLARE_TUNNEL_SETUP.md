# Permanent Cloudflare Tunnel Setup Guide

This guide will help you set up a permanent Cloudflare tunnel for your local Fineract instance. Unlike temporary tunnels, this tunnel will have a stable URL that doesn't change when you restart it.

## Prerequisites

1. A Cloudflare account (free tier is fine)
2. `cloudflared` installed on your machine
3. Your local Fineract running on `localhost:8443`

## Step-by-Step Setup

### Step 1: Run the Setup Script

```bash
cd Mifos
./setup-permanent-cloudflare-tunnel.sh
```

This script will:
1. **Log you into Cloudflare** - Opens your browser to authenticate
2. **Create a named tunnel** called `fineract-tunnel`
3. **Configure the tunnel** to route to `localhost:8443`
4. **Set up DNS routing** (if needed)

### Step 2: Set Up DNS Routing (if needed)

If the script doesn't automatically set up DNS, you have two options:

#### Option A: Use Cloudflare's Workers Domain (Free, No Custom Domain Needed)
```bash
cloudflared tunnel route dns fineract-tunnel fineract-tunnel
```

This will give you a URL like: `https://fineract-tunnel.your-account.workers.dev`

#### Option B: Use Your Own Domain (If You Have One)
```bash
cloudflared tunnel route dns fineract-tunnel fineract.yourdomain.com
```

This requires:
- Your domain to be added to Cloudflare
- DNS management through Cloudflare

### Step 3: Start the Tunnel

```bash
./start-permanent-tunnel.sh
```

Or run it manually:
```bash
cloudflared tunnel run fineract-tunnel
```

To run in the background:
```bash
cloudflared tunnel run fineract-tunnel > /tmp/cloudflared-tunnel.log 2>&1 &
```

### Step 4: Update Railway Environment Variables

1. Go to your Railway backend service settings
2. Set `MIFOS_BASE_URL` to: `https://your-tunnel-url/fineract-provider/api/v1`
   - Replace `your-tunnel-url` with the URL from Step 2
3. Set `MIFOS_VERIFY_SSL` to: `false`

## Managing the Tunnel

### Check Tunnel Status
```bash
cloudflared tunnel list
```

### View Tunnel Info
```bash
cloudflared tunnel info fineract-tunnel
```

### Stop the Tunnel
```bash
pkill -f 'cloudflared tunnel run fineract-tunnel'
```

Or if you saved the PID:
```bash
kill $(cat /tmp/cloudflared-pid.txt)
```

### Delete the Tunnel (if needed)
```bash
cloudflared tunnel delete fineract-tunnel
```

## Auto-Start on Boot (Optional)

To make the tunnel start automatically when your computer boots:

### macOS (using launchd)

Create a plist file:
```bash
cat > ~/Library/LaunchAgents/com.cloudflare.tunnel.fineract.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudflare.tunnel.fineract</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>fineract-tunnel</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/cloudflared-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/cloudflared-tunnel.log</string>
</dict>
</plist>
EOF
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.cloudflare.tunnel.fineract.plist
```

## Troubleshooting

### Tunnel won't start
- Check if you're logged in: `cloudflared tunnel list`
- Verify the tunnel exists: `cloudflared tunnel list | grep fineract-tunnel`
- Check logs: `tail -f /tmp/cloudflared-tunnel.log`

### Can't connect from Railway
- Verify the tunnel is running: `ps aux | grep cloudflared`
- Test the URL locally: `curl https://your-tunnel-url/fineract-provider/api/v1/authentication?tenantIdentifier=default`
- Check Railway logs for connection errors

### DNS not working
- Verify DNS route: `cloudflared tunnel route dns list fineract-tunnel`
- If using custom domain, ensure it's managed by Cloudflare
- Wait a few minutes for DNS propagation

## Benefits of Permanent Tunnel

✅ **Stable URL** - Doesn't change when you restart  
✅ **More reliable** - Better uptime guarantee  
✅ **Custom domain support** - Use your own domain  
✅ **Production-ready** - Suitable for production use  
✅ **Auto-reconnect** - Automatically reconnects if connection drops  

## Comparison: Temporary vs Permanent

| Feature | Temporary Tunnel | Permanent Tunnel |
|---------|-----------------|------------------|
| URL Stability | Changes on restart | Stable |
| Setup Time | 1 minute | 5 minutes |
| Cloudflare Account | Not required | Required (free) |
| Production Ready | No | Yes |
| Custom Domain | No | Yes |
| Auto-start | Manual | Can be automated |

