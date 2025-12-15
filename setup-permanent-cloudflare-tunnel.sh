#!/bin/bash

# Setup Permanent Cloudflare Tunnel for Fineract
# This creates a named tunnel that persists across restarts

set -e

TUNNEL_NAME="fineract-tunnel"
LOCAL_PORT=8443
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up permanent Cloudflare Tunnel for Fineract...${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}Error: cloudflared is not installed.${NC}"
    echo -e "${YELLOW}Install it with: brew install cloudflare/cloudflare/cloudflared${NC}"
    exit 1
fi

# Step 1: Login to Cloudflare
echo -e "${YELLOW}Step 1: Logging into Cloudflare...${NC}"
echo "This will open your browser to authenticate with Cloudflare."
echo "Press Enter to continue..."
read

cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Cloudflare. Please try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged into Cloudflare${NC}"
echo ""

# Step 2: Create the tunnel (if it doesn't exist)
echo -e "${YELLOW}Step 2: Creating tunnel '$TUNNEL_NAME'...${NC}"

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo -e "${YELLOW}Tunnel '$TUNNEL_NAME' already exists. Skipping creation.${NC}"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    echo -e "${GREEN}Using existing tunnel ID: $TUNNEL_ID${NC}"
else
    TUNNEL_ID=$(cloudflared tunnel create "$TUNNEL_NAME" | grep -oP '(?<=Created tunnel )[a-f0-9-]+' || echo "")
    if [ -z "$TUNNEL_ID" ]; then
        echo -e "${RED}Failed to create tunnel. Please check the output above.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Created tunnel '$TUNNEL_NAME' with ID: $TUNNEL_ID${NC}"
fi

echo ""

# Step 3: Create config directory
mkdir -p "$CONFIG_DIR"

# Step 4: Create or update config file
echo -e "${YELLOW}Step 3: Creating tunnel configuration...${NC}"

cat > "$CONFIG_FILE" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  # Route Fineract API requests
  - hostname: fineract-tunnel.$(cloudflared tunnel info "$TUNNEL_ID" 2>/dev/null | grep -oP '(?<=Hostname: )[^ ]+' | head -1 || echo "your-account.workers.dev")
    service: https://localhost:$LOCAL_PORT
    originRequest:
      noTLSVerify: true
  # Catch-all rule (must be last)
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Configuration file created at: $CONFIG_FILE${NC}"
echo ""

# Step 5: Get the tunnel URL
echo -e "${YELLOW}Step 4: Getting tunnel URL...${NC}"

# Try to get the hostname from Cloudflare
HOSTNAME=$(cloudflared tunnel route dns list "$TUNNEL_NAME" 2>/dev/null | grep -oP '[a-z0-9-]+\.[a-z0-9.-]+' | head -1 || echo "")

if [ -z "$HOSTNAME" ]; then
    echo -e "${YELLOW}No DNS route found. You'll need to set up DNS routing.${NC}"
    echo -e "${YELLOW}Run this command to set up DNS:${NC}"
    echo -e "${GREEN}cloudflared tunnel route dns $TUNNEL_NAME fineract-tunnel${NC}"
    echo ""
    echo -e "${YELLOW}Or use a custom domain:${NC}"
    echo -e "${GREEN}cloudflared tunnel route dns $TUNNEL_NAME fineract.yourdomain.com${NC}"
    echo ""
    TUNNEL_URL="https://fineract-tunnel.your-account.workers.dev"
else
    TUNNEL_URL="https://$HOSTNAME"
    echo -e "${GREEN}✅ Tunnel URL: $TUNNEL_URL${NC}"
fi

echo ""

# Step 6: Save tunnel URL
echo "$TUNNEL_URL" > /tmp/cloudflared-url.txt
echo -e "${GREEN}✅ Tunnel URL saved to /tmp/cloudflared-url.txt${NC}"
echo ""

# Step 7: Instructions for running the tunnel
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}To start the tunnel, run:${NC}"
echo -e "${GREEN}cloudflared tunnel run $TUNNEL_NAME${NC}"
echo ""
echo -e "${YELLOW}Or run it in the background:${NC}"
echo -e "${GREEN}cloudflared tunnel run $TUNNEL_NAME > /tmp/cloudflared-tunnel.log 2>&1 &${NC}"
echo ""
echo -e "${YELLOW}To stop the tunnel:${NC}"
echo -e "${GREEN}pkill -f 'cloudflared tunnel run $TUNNEL_NAME'${NC}"
echo ""
echo -e "${YELLOW}Tunnel URL: $TUNNEL_URL${NC}"
echo -e "${YELLOW}Update Railway MIFOS_BASE_URL to: $TUNNEL_URL/fineract-provider/api/v1${NC}"
echo ""

