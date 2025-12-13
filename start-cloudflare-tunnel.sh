#!/bin/bash

# Start Cloudflare Tunnel for Fineract
# This script starts a tunnel and captures the public URL

echo "Starting Cloudflare Tunnel for Fineract (localhost:8443)..."
echo ""

# Start tunnel in background and capture output
cloudflared tunnel --url https://localhost:8443 --no-tls-verify > /tmp/cloudflared-tunnel.log 2>&1 &
TUNNEL_PID=$!

# Wait a few seconds for tunnel to start
sleep 5

# Extract the URL from the log
TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflared-tunnel.log | head -1)

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Could not find tunnel URL. Check /tmp/cloudflared-tunnel.log"
    echo ""
    echo "Log contents:"
    cat /tmp/cloudflared-tunnel.log
    exit 1
fi

echo "✅ Cloudflare Tunnel started!"
echo ""
echo "Public URL: $TUNNEL_URL"
echo "PID: $TUNNEL_PID"
echo ""
echo "Update your backend environment variables:"
echo "  MIFOS_BASE_URL=$TUNNEL_URL"
echo "  MIFOS_VERIFY_SSL=false"
echo ""
echo "To stop the tunnel, run: kill $TUNNEL_PID"
echo ""
echo "Log file: /tmp/cloudflared-tunnel.log"

# Save the URL and PID for later use
echo "$TUNNEL_URL" > /tmp/cloudflared-url.txt
echo "$TUNNEL_PID" > /tmp/cloudflared-pid.txt

