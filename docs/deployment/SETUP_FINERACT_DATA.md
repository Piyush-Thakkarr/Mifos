# Setup Fineract Data

This guide helps you populate your local Fineract Docker instance with all necessary data (offices, staff, clients, loan products, etc.) so it matches what the demo server has.

## Prerequisites

1. **Fineract Docker instance running** on `localhost:8443`

   ```bash
   docker ps | grep fineract
   ```

2. **Default credentials**:
   - Username: `mifos`
   - Password: `password`
   - Tenant: `default`

## Quick Start

Run the setup script:

```bash
cd Mifos
./setup-fineract-data.sh
```

The script will:

1. ✅ Test connection to Fineract
2. ✅ Verify/Create Head Office
3. ✅ Create Staff (Loan Officers)
4. ✅ Create Fund
5. ✅ Create 3 Loan Products:
   - Short Term Loan (12% interest, 12 months)
   - Long Term Loan (8% interest, 60 months)
   - Progressive Loan (15% interest, 24 months, advanced payment allocation)
6. ✅ Create 3 Clients:
   - John Smith
   - Jane Doe
   - Bob Johnson
7. ✅ Create sample loan applications

## Using Custom Fineract URL

If your Fineract is running on a different URL (e.g., via Cloudflare Tunnel):

```bash
FINERACT_URL="https://your-tunnel-url.trycloudflare.com/fineract-provider/api/v1" ./setup-fineract-data.sh
```

## What Gets Created

### Offices

- **Head Office** (ID: 1, usually already exists)

### Staff

- **Loan Officer**: John Doe (assigned to Head Office)

### Funds

- **Loan Fund** (for loan products)

### Loan Products

1. **Short Term Loan** (STL)
   - Principal: $10,000
   - Interest: 12% per year
   - Term: 12 months
   - Strategy: Standard

2. **Long Term Loan** (LTL)
   - Principal: $50,000
   - Interest: 8% per year
   - Term: 60 months
   - Strategy: Standard

3. **Progressive Loan** (PL)
   - Principal: $20,000
   - Interest: 15% per year
   - Term: 24 months
   - Strategy: Advanced Payment Allocation (like demo server)

### Clients

1. **John Smith** (Client ID: varies)
2. **Jane Doe** (Client ID: varies)
3. **Bob Johnson** (Client ID: varies)

## Verifying Setup

After running the script, verify the data:

```bash
# Test connection
curl -k -X GET "https://localhost:8443/fineract-provider/api/v1/loanproducts?tenantIdentifier=default" \
  -u "mifos:password" \
  -H "Fineract-Platform-TenantId: default"

# List clients
curl -k -X GET "https://localhost:8443/fineract-provider/api/v1/clients?tenantIdentifier=default" \
  -u "mifos:password" \
  -H "Fineract-Platform-TenantId: default"
```

## Troubleshooting

### "Connection refused" or SSL errors

- Make sure Fineract is running: `docker ps | grep fineract`
- Check if it's on port 8443: `docker ps`
- The script uses `-k` flag to ignore SSL certificate errors

### "Authentication failed"

- Default credentials should be `mifos:password`
- If you changed them, update the script or set environment variables:
  ```bash
  USERNAME=your_username PASSWORD=your_password ./setup-fineract-data.sh
  ```

### "Office not found"

- Fineract should create a default Head Office on first startup
- If not, the script will try to create one

### Loan products fail to create

- Loan products require accounting setup (Chart of Accounts)
- If accounting is enabled, you may need to set up accounts first
- Try disabling accounting in the loan product creation

## Manual Setup (Alternative)

If the script doesn't work, you can manually create data using the Fineract UI:

1. Open Fineract UI: `https://localhost:8443` (or your tunnel URL)
2. Login with `mifos` / `password`
3. Navigate through:
   - **Organization** → **Offices** → Create office
   - **Organization** → **Staff** → Create staff
   - **Products** → **Loan Products** → Create loan product
   - **Clients** → **Clients** → Create client

## Next Steps

After setup:

1. ✅ Start Cloudflare Tunnel: `./start-cloudflare-tunnel.sh`
2. ✅ Update backend to use tunnel URL
3. ✅ Test client portal login
4. ✅ Test loan application submission

## Notes

- **Client IDs**: The script outputs the created client IDs. You'll need these for testing.
- **Loan Product IDs**: These are needed when submitting loan applications.
- **Accounting**: If you enable accounting, you'll need to set up Chart of Accounts first (not included in this script).
