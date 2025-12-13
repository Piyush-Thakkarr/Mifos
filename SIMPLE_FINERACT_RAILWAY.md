# Simple Fineract Deployment on Railway

## Overview

This guide shows you how to deploy Fineract on Railway using the official Docker image - just like running `docker-compose up` locally, but simpler.

## Step 1: Delete Current Fineract Service (If Exists)

1. Go to your Railway project
2. Find your **Fineract** service
3. Click the **three dots** → **Delete**
4. Confirm deletion

## Step 2: Create MySQL Service (If Not Exists)

1. Click **"+ New"** → **Database** → **Add MySQL**
2. Wait for it to start
3. Note the connection details (you'll need them)

## Step 3: Create Fineract Databases

1. Click **"+ New"** → **Empty Service**
2. Name it: `db-setup`
3. Go to **Settings** → **Deploy**
4. **Source**: Select **"Docker Hub"**
5. **Image**: `mysql:8.0`
6. **Variables** tab, add:
   - `MYSQL_ALLOW_EMPTY_PASSWORD=yes`
7. **Settings** → **Deploy** → **Custom Start Command**:
   ```bash
   sh -c "mysql -h mysql.railway.internal -P 3306 -u root -p${{MYSQL_ROOT_PASSWORD}} -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
   ```
   **Important**: Replace `${{MYSQL_ROOT_PASSWORD}}` with your actual MySQL root password from Railway variables
8. Wait for it to complete (check logs)
9. **Delete** this temporary service after databases are created

## Step 4: Deploy Fineract

1. Click **"+ New"** → **Empty Service**
2. Name it: `fineract`
3. Go to **Settings** → **Deploy**
4. **Source**: Select **"Docker Hub"**
5. **Image**: `apache/fineract:latest`
6. **Port**: `8443`

## Step 5: Set Environment Variables

Go to **Variables** tab and add these (replace with your actual MySQL values):

```bash
# Database Connection (Tenant Store)
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD

# Default Tenant Database Creation
FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=YOUR_MYSQL_ROOT_PASSWORD
FINERACT_DEFAULT_TENANTDB_NAME=fineract_default
FINERACT_DEFAULT_TENANTDB_IDENTIFIER=default
FINERACT_DEFAULT_TENANTDB_DESCRIPTION=Default Demo Tenant
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

# Server Settings
PORT=8443
FINERACT_SERVER_SSL_ENABLED=true
FINERACT_NODE_ID=1

# Optional: Memory Settings (if needed)
JAVA_TOOL_OPTIONS=-Xmx1G -XX:MinRAMPercentage=25 -XX:MaxRAMPercentage=80
```

**Important**:

- Replace `YOUR_MYSQL_ROOT_PASSWORD` with your actual MySQL root password
- Get MySQL password from: **MySQL service** → **Variables** → `MYSQL_ROOT_PASSWORD`

## Step 6: Disable Healthcheck

1. Go to **Settings** → **Healthcheck**
2. **Clear** the **Healthcheck Path** field (leave empty)
3. **Save**

## Step 7: Wait for Startup

1. Fineract will start automatically
2. First startup takes **5-8 minutes** (database migrations)
3. Watch the logs - you should see:
   - `HikariPool-1 - Starting...`
   - `Tenant store upgrade finished`
   - `Started ServerApplication`

## Step 8: Get Fineract URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** or use the provided domain
3. Your Fineract API will be at: `https://your-domain.up.railway.app/fineract-provider/api/v1`

## Step 9: Update Backend to Use Your Fineract

In your Django backend Railway service, set:

```bash
MIFOS_BASE_URL=https://your-fineract-domain.up.railway.app/fineract-provider/api/v1
MIFOS_VERIFY_SSL=false
```

## Troubleshooting

### Fineract Keeps Restarting

- **Check**: Healthcheck is disabled (Step 6)
- **Check**: Databases exist (`fineract_tenants` and `fineract_default`)
- **Check**: MySQL password is correct
- **Check**: Memory limits in Railway (increase if needed)

### Can't Connect to MySQL

- **Check**: MySQL service is running
- **Check**: Using `mysql.railway.internal` (internal hostname)
- **Check**: Port is `3306`

### Slow Startup

- **Normal**: First startup takes 5-8 minutes
- **Check logs**: Should see "Tenant store upgrade finished"
- **Be patient**: Don't restart during migrations

## That's It!

Your Fineract should now be running. Test it:

```bash
curl -k https://your-fineract-domain.up.railway.app/fineract-provider/actuator/health
```

Should return: `{"status":"UP"}`
