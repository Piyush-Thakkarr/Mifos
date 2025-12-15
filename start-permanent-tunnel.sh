#!/bin/bash

# Start the permanent Cloudflare tunnel for Fineract

TUNNEL_NAME="fineract-tunnel"
LOG_FILE="/tmp/cloudflared-tunnel.log"
PID_FILE="/tmp/cloudflared-pid.txt"
URL_FILE="/tmp/cloudflared-url.txt"

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting permanent Cloudflare Tunnel '$TUNNEL_NAME'...${NC}"

# Check if tunnel is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Tunnel is already running with PID $OLD_PID${NC}"
        echo -e "${YELLOW}To stop it, run: kill $OLD_PID${NC}"
        exit 1
    else
        rm "$PID_FILE" 2>/dev/null
    fi
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}Error: cloudflared is not installed.${NC}"
    exit 1
fi

# Start the tunnel in the background
cloudflared tunnel run "$TUNNEL_NAME" > "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

# Save the PID
echo $TUNNEL_PID > "$PID_FILE"

# Wait a moment for tunnel to start
sleep 3

# Get the tunnel URL from DNS or config
TUNNEL_URL=$(cloudflared tunnel route dns list "$TUNNEL_NAME" 2>/dev/null | grep -oP 'https://[a-z0-9-]+\.[a-z0-9.-]+' | head -1 || echo "")

if [ -z "$TUNNEL_URL" ]; then
    # Try to get from config file
    CONFIG_FILE="$HOME/.cloudflared/config.yml"
    if [ -f "$CONFIG_FILE" ]; then
        HOSTNAME=$(grep -oP '(?<=hostname: )[^ ]+' "$CONFIG_FILE" | head -1)
        if [ -n "$HOSTNAME" ]; then
            TUNNEL_URL="https://$HOSTNAME"
        fi
    fi
fi

if [ -n "$TUNNEL_URL" ]; then
    echo "$TUNNEL_URL" > "$URL_FILE"
    echo -e "${GREEN}✅ Tunnel started!${NC}"
    echo -e "${GREEN}PID: $TUNNEL_PID${NC}"
    echo -e "${GREEN}Tunnel URL: $TUNNEL_URL${NC}"
    echo ""
    echo -e "${YELLOW}Update Railway MIFOS_BASE_URL to:${NC}"
    echo -e "${GREEN}$TUNNEL_URL/fineract-provider/api/v1${NC}"
    echo ""
    echo -e "${YELLOW}To stop the tunnel: kill $TUNNEL_PID${NC}"
else
    echo -e "${YELLOW}⚠️  Tunnel started but URL not found.${NC}"
    echo -e "${YELLOW}Check the log file: $LOG_FILE${NC}"
    echo -e "${YELLOW}PID: $TUNNEL_PID${NC}"
fi

