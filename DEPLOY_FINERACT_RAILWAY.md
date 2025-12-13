# Deploy Your Own Fineract Server on Railway

This guide will help you deploy your own Fineract instance on Railway, separate from your main project.

## Step 1: Fork Fineract Repository

1. **Go to Apache Fineract GitHub:**
   - Visit: https://github.com/apache/fineract
   - Click "Fork" button (top right)
   - This creates your own copy of the Fineract repository

2. **Clone your fork locally (optional, for testing):**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fineract.git
   cd fineract
   ```

## Step 2: Deploy to Railway

### Option A: Deploy Using Docker Image (Easiest - Recommended)

Railway can deploy directly from Docker images. This is the simplest approach:

1. **Create a new Railway project:**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked `fineract` repository

2. **Add MySQL Database:**
   - In your Railway project, click "+ New"
   - Select "Database" → "MySQL"
   - Railway will automatically create a MySQL database
   - **Note down these connection details** (you'll need them):
     - `MYSQLHOST` (hostname)
     - `MYSQLPORT` (usually 3306)
     - `MYSQLDATABASE` (database name)
     - `MYSQLUSER` (username)
     - `MYSQLPASSWORD` (password)

3. **Configure Fineract Service:**
   - In your Railway project, click on the Fineract service
   - Go to "Settings" → "Variables"
   - Add these environment variables:

   ```env
   # Database Configuration
   FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
   FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://MYSQLHOST:MYSQLPORT/MYSQLDATABASE
   FINERACT_HIKARI_USERNAME=MYSQLUSER
   FINERACT_HIKARI_PASSWORD=MYSQLPASSWORD

   # Tenant Database Configuration
   FINERACT_DEFAULT_TENANTDB_HOSTNAME=MYSQLHOST
   FINERACT_DEFAULT_TENANTDB_PORT=MYSQLPORT
   FINERACT_DEFAULT_TENANTDB_UID=MYSQLUSER
   FINERACT_DEFAULT_TENANTDB_PWD=MYSQLPASSWORD
   FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

   # Fineract Configuration
   FINERACT_NODE_ID=1
   FINERACT_TENANT_APPUSER=appuser
   FINERACT_TENANT_APPPASS=apppass

   # Port Configuration
   PORT=8443
   ```

   **Important:** Replace `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` with the actual values from your MySQL service.

### Option B: Use Official Docker Image (Simplest - Recommended)

**No Dockerfile or railway.json needed!** Just use the official image directly.

1. **Create a new Railway service:**
   - Click "+ New" → "Empty Service"
   - Go to "Settings" → "Deploy"
   - Set "Source" to "Docker Image"
   - Enter: `apache/fineract:latest`

2. **Add the same environment variables as Option A**

3. **Set the port:**
   - In Railway, go to "Settings" → "Networking"
   - Set "Port" to `8443`

**That's it!** Railway will automatically pull and run the official Fineract Docker image. No need to fork the repo, build from source, or create any configuration files.

### Option C: Build from Source (Advanced - Only if you need customizations)

If you need to customize Fineract or build from source:

1. **Fork the Fineract repository** (as mentioned in Step 1)

2. **Create a Dockerfile** in the root of your forked repo:

   ```dockerfile
   FROM azul/zulu-openjdk-alpine:21

   WORKDIR /app

   # Copy the built JAR (you'll need to build it first)
   COPY fineract-provider/build/libs/fineract-provider.jar app.jar

   EXPOSE 8443

   ENTRYPOINT ["java", "-jar", "app.jar"]
   ```

3. **Create railway.json** (optional, for custom build settings):

   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile"
     }
   }
   ```

   **Note:** `dockerfilePath` is the path to your Dockerfile relative to the repo root. If your Dockerfile is in the root, use `"Dockerfile"`. If it's in a subdirectory, use `"path/to/Dockerfile"`.

4. **Deploy from your GitHub repo:**
   - In Railway, connect your forked Fineract repo
   - Railway will detect the Dockerfile and build it automatically

## Step 3: Initialize Fineract Database

After deployment, you need to initialize the database:

1. **Get your Fineract service URL:**
   - In Railway, go to your Fineract service
   - Click "Settings" → "Networking"
   - Note the public URL (e.g., `https://fineract-production.up.railway.app`)

2. **Wait for Fineract to start:**
   - Check logs in Railway to see when Fineract is ready
   - Look for: "Started FineractProviderApplication"

3. **Initialize the database:**
   - Fineract will auto-initialize on first startup
   - Check health: `https://YOUR_FINERACT_URL/fineract-provider/actuator/health`

## Step 4: Create Initial Data

Once Fineract is running, create initial data:

1. **Create Office:**

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

2. **Create Staff:**

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

3. **Create Client:**
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

## Step 5: Configure Your Backend to Use Your Fineract

1. **Get your Fineract URL:**
   - From Railway: `https://YOUR_FINERACT_SERVICE.up.railway.app`

2. **Update Railway environment variables for your backend:**
   - Go to your backend service on Railway
   - Settings → Variables
   - Add/Update:

   ```env
   MIFOS_BASE_URL=https://YOUR_FINERACT_SERVICE.up.railway.app/fineract-provider/api/v1
   MIFOS_TENANT_ID=default
   MIFOS_ADMIN_USER=mifos
   MIFOS_ADMIN_PASS=password
   MIFOS_VERIFY_SSL=true
   MIFOS_CLIENT_ID=1
   ```

3. **Redeploy your backend:**
   - Railway will automatically redeploy when you update environment variables
   - Or manually trigger a redeploy

## Step 6: Test the Connection

1. **Test from your backend:**

   ```bash
   curl https://YOUR_BACKEND_URL/api/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username": "client", "password": "password"}'
   ```

2. **Check logs:**
   - Verify in Railway logs that your backend can connect to Fineract
   - Look for successful API calls

## Troubleshooting

### Fineract won't start:

- Check MySQL connection string
- Verify all environment variables are set correctly
- Check Railway logs for errors

### Database connection errors:

- Ensure MySQL service is running
- Verify connection credentials
- Check that `FINERACT_HIKARI_JDBC_URL` is correct

### SSL Certificate errors:

- For Railway deployments, SSL is handled automatically
- Set `MIFOS_VERIFY_SSL=true` in your backend
- Railway provides valid SSL certificates

### Port issues:

- Fineract uses port 8443 by default
- Railway will map this automatically
- Check "Settings" → "Networking" in Railway

## Quick Reference

**Fineract Repository:** https://github.com/apache/fineract  
**Official Docker Image:** `apache/fineract:latest`  
**Default Admin:** `mifos` / `password`  
**Default Tenant:** `default`  
**Default Port:** `8443`

## Next Steps

After deployment:

1. Create your clients, loan products, and loans
2. Update your backend environment variables
3. Test the full flow from frontend → backend → Fineract
