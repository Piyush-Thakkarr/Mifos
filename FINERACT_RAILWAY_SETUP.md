# Quick Setup: Fineract on Railway with MySQL

## Important: Use Docker, Not Railpack

**Railpack is for Python/Node.js apps** - it won't work for Fineract (Java app).

**Use Docker instead:**

- Railway supports Docker images directly
- Use the official Fineract Docker image: `apache/fineract:latest`
- Much simpler than building from source

## Step 1: Set Up Fineract Service with Docker

### Option A: Use Official Docker Image (Recommended - Easiest)

1. **In your Railway project:**
   - Click on your **"fineract"** service
   - Go to **"Settings"** → **"Deploy"**
   - Change **"Source"** to **"Docker Image"**
   - Enter: `apache/fineract:latest`
   - Click **"Save"**

2. **Set the port:**
   - Go to **"Settings"** → **"Networking"**
   - Set **"Port"** to `8443`

### Option B: If You Already Have a Service

If your Fineract service is already set up with Railpack:

1. Go to **"Settings"** → **"Deploy"**
2. Change **"Source"** from **"GitHub Repo"** to **"Docker Image"**
3. Enter: `apache/fineract:latest`
4. Railway will redeploy using Docker

## Step 2: Configure Fineract Service Variables

In your Railway project, click on the **"fineract"** service, then go to **"Variables"** tab.

### Add These Environment Variables:

1. **Click "+ New Variable"** and add each of these:

```env
# Database Connection (use Variable References from MySQL service)
FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}
FINERACT_HIKARI_USERNAME=${MYSQLUSER}
FINERACT_HIKARI_PASSWORD=${MYSQLPASSWORD}

# Tenant Database Configuration
FINERACT_DEFAULT_TENANTDB_HOSTNAME=${MYSQLHOST}
FINERACT_DEFAULT_TENANTDB_PORT=${MYSQLPORT}
FINERACT_DEFAULT_TENANTDB_UID=${MYSQLUSER}
FINERACT_DEFAULT_TENANTDB_PWD=${MYSQLPASSWORD}
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

# Fineract Configuration
FINERACT_NODE_ID=1
FINERACT_TENANT_APPUSER=appuser
FINERACT_TENANT_APPPASS=apppass

# Port Configuration
PORT=8443
```

### How to Use Variable References:

Instead of typing the actual values, use Railway's **Variable Reference** feature:

1. Click **"+ New Variable"**
2. For `FINERACT_HIKARI_JDBC_URL`, enter:
   - **Key:** `FINERACT_HIKARI_JDBC_URL`
   - **Value:** Click the link icon or type: `jdbc:mariadb://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}`
   - Railway will automatically reference the MySQL service variables

3. For other variables, use the same pattern:
   - `${MYSQLHOST}` → References MySQL host
   - `${MYSQLPORT}` → References MySQL port (3306)
   - `${MYSQLUSER}` → References MySQL user (root)
   - `${MYSQLPASSWORD}` → References MySQL password
   - `${MYSQLDATABASE}` → References MySQL database (railway)

### Alternative: Manual Entry (if Variable References don't work)

If variable references don't work, you can manually enter the values:

```env
FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/railway
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP

FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

FINERACT_NODE_ID=1
FINERACT_TENANT_APPUSER=appuser
FINERACT_TENANT_APPPASS=apppass

PORT=8443
```

## Step 2: Configure Networking

1. Go to **"Settings"** → **"Networking"** in your Fineract service
2. Set **"Port"** to `8443`
3. Make sure **"Generate Domain"** is enabled (so you get a public URL)

## Step 3: Wait for Deployment

- The Fineract service should automatically redeploy when you add variables
- Check the **"Deployments"** tab to see build progress
- Check **"Logs"** tab to see if Fineract starts successfully

## Step 4: Verify Fineract is Running

Once deployment completes:

1. Get your Fineract URL from **"Settings"** → **"Networking"**
   - Example: `https://fineract-production.up.railway.app`

2. Test health endpoint:

   ```bash
   curl https://YOUR_FINERACT_URL/fineract-provider/actuator/health
   ```

3. Test authentication:
   ```bash
   curl -X POST 'https://YOUR_FINERACT_URL/fineract-provider/api/v1/authentication' \
     -H 'Content-Type: application/json' \
     -H 'Fineract-Platform-TenantId: default' \
     -d '{
       "username": "mifos",
       "password": "password"
     }'
   ```

## Step 5: Create Initial Data

Once Fineract is running, create initial data (office, staff, client):

### Create Office:

```bash
curl -X POST 'https://YOUR_FINERACT_URL/fineract-provider/api/v1/offices' \
  -H 'Content-Type: application/json' \
  -H 'Fineract-Platform-TenantId: default' \
  -u mifos:password \
  -d '{
    "name": "Head Office",
    "openingDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }'
```

### Create Staff:

```bash
curl -X POST 'https://YOUR_FINERACT_URL/fineract-provider/api/v1/staff' \
  -H 'Content-Type: application/json' \
  -H 'Fineract-Platform-TenantId: default' \
  -u mifos:password \
  -d '{
    "firstname": "Admin",
    "lastname": "User",
    "officeId": 1,
    "isLoanOfficer": true,
    "joiningDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }'
```

### Create Client:

```bash
curl -X POST 'https://YOUR_FINERACT_URL/fineract-provider/api/v1/clients' \
  -H 'Content-Type: application/json' \
  -H 'Fineract-Platform-TenantId: default' \
  -u mifos:password \
  -d '{
    "firstname": "Test",
    "lastname": "Client",
    "officeId": 1,
    "active": true,
    "activationDate": "2024-01-01",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }'
```

## Step 6: Update Your Backend to Use Your Fineract

1. Go to your **backend service** on Railway
2. **Settings** → **Variables**
3. Add/Update:
   ```env
   MIFOS_BASE_URL=https://YOUR_FINERACT_URL/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=mifos
   MIFOS_ADMIN_PASS=password
   MIFOS_VERIFY_SSL=true
   MIFOS_CLIENT_ID=1
   ```

## Troubleshooting

### Fineract won't start:

- Check that all environment variables are set correctly
- Verify MySQL connection string format
- Check logs for specific error messages

### Database connection errors:

- Ensure MySQL service is "Online"
- Verify variable references are correct
- Check that `${MYSQLHOST}` resolves to `mysql.railway.internal`

### Port issues:

- Fineract uses port 8443
- Railway will map this automatically
- Check "Settings" → "Networking" → "Port"
