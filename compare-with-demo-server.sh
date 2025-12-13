#!/bin/bash

# Compare local Fineract with demo server
# This script fetches data from both and shows what's missing

set -e

LOCAL_URL="${LOCAL_URL:-https://localhost:8443/fineract-provider/api/v1}"
DEMO_URL="https://demo.mifos.io/fineract-provider/api/v1"
TENANT="default"
USERNAME="mifos"
PASSWORD="password"

echo "🔍 Comparing local Fineract with demo server..."
echo ""

# Function to make API calls
api_call() {
    local url=$1
    local endpoint=$2
    curl -k -s --max-time 10 -X GET \
        "${url}${endpoint}?tenantIdentifier=${TENANT}" \
        -u "${USERNAME}:${PASSWORD}" \
        -H "Fineract-Platform-TenantId: ${TENANT}" 2>/dev/null || echo "[]"
}

echo "📊 Loan Products:"
echo "Local:"
local_products=$(api_call "$LOCAL_URL" "/loanproducts")
echo "$local_products" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'  Total: {len(data)}'); [print(f'    - {p[\"name\"]} ({p[\"shortName\"]})') for p in data]" 2>/dev/null || echo "  Error fetching"

echo ""
echo "Demo Server:"
demo_products=$(api_call "$DEMO_URL" "/loanproducts")
echo "$demo_products" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'  Total: {len(data)}'); [print(f'    - {p[\"name\"]} ({p[\"shortName\"]})') for p in data[:10]]" 2>/dev/null || echo "  Error fetching or server down"

echo ""
echo "📋 Clients:"
echo "Local:"
local_clients=$(api_call "$LOCAL_URL" "/clients")
echo "$local_clients" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'  Total: {len(data)}')" 2>/dev/null || echo "  Error fetching"

echo ""
echo "Demo Server:"
demo_clients=$(api_call "$DEMO_URL" "/clients")
echo "$demo_clients" | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'  Total: {len(data)}')" 2>/dev/null || echo "  Error fetching or server down"

