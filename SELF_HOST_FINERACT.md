# Self-Host Fineract on Railway

This guide will help you deploy your own Fineract instance on Railway, create clients, and configure it for your client portal.

## Prerequisites

- Railway account (you already have this)
- Basic understanding of environment variables

## Step 1: Deploy Fineract on Railway

### Option A: Using Railway's Docker Support (Recommended)

1. **Create a new Railway service:**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo" or "Empty Project"

2. **Add a MySQL Database:**
   - In your Railway project, click "+ New"
   - Select "Database" → "MySQL"
   - Railway will automatically create a MySQL database
   - Note down the connection details (host, port, database, user, password)

3. **Deploy Fineract using Docker:**
   - In Railway, click "+ New" → "GitHub Repo"
   - Or create a new service and select "Dockerfile"
   - We'll use the official Fineract Docker image

### Option B: Quick Setup with Docker Compose (Local Testing First)

If you want to test locally first, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: fineract_tenants
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

  fineract:
    image: apache/fineract:latest
    ports:
      - '8443:8443'
    environment:
      FINERACT_HOST: fineract
      FINERACT_PORT: 8443
      FINERACT_SERVER_PROTOCOL: https
      FINERACT_SERVER_PORT: 8443
      FINERACT_DB_HOST: mysql
      FINERACT_DB_PORT: 3306
      FINERACT_DB_NAME: fineract_tenants
      FINERACT_DB_USERNAME: root
      FINERACT_DB_PASSWORD: rootpassword
    depends_on:
      - mysql
    volumes:
      - fineract_data:/var/fineract

volumes:
  mysql_data:
  fineract_data:
```

## Step 2: Railway Deployment (Recommended for Production)

### Create Railway Project Structure

1. **Create a new directory for Fineract deployment:**

```bash
mkdir fineract-railway
cd fineract-railway
```

2. **Create `Dockerfile`:**

```dockerfile
FROM apache/fineract:latest

# Expose Fineract port
EXPOSE 8443

# Fineract will use environment variables for configuration
```

3. **Create `railway.json` (optional, for Railway-specific config):**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

4. **Push to GitHub and connect to Railway:**
   - Create a new GitHub repo
   - Push the Dockerfile
   - Connect it to Railway

### Configure Environment Variables in Railway

In your Railway Fineract service, set these environment variables:

```
FINERACT_HOST=0.0.0.0
FINERACT_PORT=8443
FINERACT_SERVER_PROTOCOL=https
FINERACT_SERVER_PORT=8443

# Database Configuration (from Railway MySQL service)
FINERACT_DB_HOST=<mysql-host-from-railway>
FINERACT_DB_PORT=3306
FINERACT_DB_NAME=<database-name>
FINERACT_DB_USERNAME=<mysql-user>
FINERACT_DB_PASSWORD=<mysql-password>

# Tenant Configuration
FINERACT_TENANT_ID=default
```

**Important:** Railway will provide a public URL like `https://your-fineract-service.up.railway.app`

## Step 3: Update Your Client Portal Backend

Once Fineract is deployed, update your Railway backend service environment variables:

1. **Go to Railway Dashboard → Your Backend Service → Variables**

2. **Update these variables:**

```
MIFOS_BASE_URL=https://your-fineract-service.up.railway.app/fineract-provider/api/v1
MIFOS_TENANT_ID=default
MIFOS_ADMIN_USER=mifos
MIFOS_ADMIN_PASS=password
MIFOS_VERIFY_SSL=false  # Set to false for Railway's self-signed certs, or true if you add custom domain with SSL
MIFOS_CLIENT_ID=1  # We'll create clients and update this
```

3. **Redeploy your backend service**

## Step 4: Access Fineract and Create Initial Setup

### Access Fineract API

1. **Get your Fineract URL from Railway** (e.g., `https://your-fineract.up.railway.app`)

2. **Test the API:**

```bash
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/authentication \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -d '{"username":"mifos","password":"password"}' \
  -X POST
```

### Create Office (Required before clients)

```bash
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/offices \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "name": "Head Office",
    "openingDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST
```

Note the `officeId` from the response.

### Create Staff (Required for loan officers)

```bash
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/staff \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "firstname": "Loan",
    "lastname": "Officer",
    "officeId": 1,
    "isLoanOfficer": true,
    "joiningDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST
```

Note the `staffId` from the response.

### Create 3 Clients

Replace `<officeId>` and `<staffId>` with the IDs from above:

```bash
# Client 1
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/clients \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "firstname": "Jane",
    "lastname": "Doe",
    "officeId": <officeId>,
    "active": true,
    "activationDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST

# Client 2
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/clients \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "firstname": "John",
    "lastname": "Smith",
    "officeId": <officeId>,
    "active": true,
    "activationDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST

# Client 3
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/clients \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "firstname": "Alice",
    "lastname": "Johnson",
    "officeId": <officeId>,
    "active": true,
    "activationDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST
```

Note the `clientId` from each response. Update `MIFOS_CLIENT_ID` in your backend to one of these IDs (e.g., the first client's ID).

### Create Loan Product

```bash
curl -k https://your-fineract.up.railway.app/fineract-provider/api/v1/loanproducts \
  -H "Fineract-Platform-TenantId: default" \
  -H "Content-Type: application/json" \
  -u mifos:password \
  -d '{
    "name": "Microfinance Loan Product",
    "shortName": "MFI Loan",
    "description": "Standard microfinance loan product",
    "fundId": 1,
    "currencyCode": "USD",
    "principal": 10000,
    "numberOfRepayments": 12,
    "repaymentEvery": 1,
    "repaymentFrequencyType": 2,
    "interestRatePerPeriod": 12.0,
    "interestRateFrequencyType": 2,
    "amortizationType": 1,
    "interestType": 0,
    "interestCalculationPeriodType": 1,
    "transactionProcessingStrategyCode": "mifos-standard-strategy",
    "accountingRule": 1,
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }' \
  -X POST
```

## Step 5: Verify Setup

1. **Test client portal login** - should work now
2. **Check dashboard** - should show client data
3. **Test loan application** - should work with your loan products

## Troubleshooting

### SSL Certificate Issues

- Set `MIFOS_VERIFY_SSL=false` in Railway backend if using Railway's default domain
- Or add a custom domain with proper SSL certificate

### Database Connection Issues

- Ensure MySQL service is running in Railway
- Check database credentials match in Fineract environment variables
- Verify network connectivity between services

### Fineract Not Starting

- Check Railway logs for errors
- Ensure all required environment variables are set
- Verify database is accessible

## Alternative: Use Fineract Community App (Web UI)

If you want a web UI to manage Fineract:

1. Deploy the Mifos Community App (separate service)
2. Point it to your Fineract API URL
3. Use it to create clients, products, etc. via UI instead of curl commands

## Next Steps

- Create more loan products as needed
- Set up savings products
- Configure charges and fees
- Set up repayment schedules
- Test all client portal features
