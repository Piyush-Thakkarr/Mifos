# Fix Temporary Service - Use MySQL Client

## The Problem

You're using `mysql:8.0` which is a MySQL **server** image. It's trying to initialize a new database, but we need a MySQL **client** to connect to your existing MySQL service.

## Solution: Use a Different Approach

### Option 1: Use a Script-Based Image (Easiest)

1. **Delete the current temporary service** (or we'll fix it)

2. **Create a new service** with a script that runs the MySQL client:
   - **Source**: Docker Image
   - **Image**: `mysql:8.0` (same, but we'll use it differently)
   - **Custom Start Command**:

   ```bash
   sh -c "mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;' && sleep 10"
   ```

   **Important:** Replace `cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP` with your actual MySQL password from the Variables tab.

3. **Add Environment Variable** (to prevent MySQL server initialization):
   ```
   MYSQL_ALLOW_EMPTY_PASSWORD=yes
   ```

### Option 2: Use a One-Liner Script Image

Use a lightweight image that can run MySQL commands:

1. **Source**: Docker Image
2. **Image**: `mysql:8.0`
3. **Custom Start Command**:
   ```bash
   mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;"
   ```
4. **Add Variable**:
   ```
   MYSQL_ALLOW_EMPTY_PASSWORD=yes
   ```

### Option 3: Use a Shell Script Image

1. **Source**: Docker Image
2. **Image**: `alpine:latest`
3. **Custom Start Command**:
   ```bash
   sh -c "apk add --no-cache mysql-client && mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
   ```

## Quick Fix for Current Service

If you want to fix the current service:

1. Go to your temporary service → **Variables** tab
2. Add:
   ```
   MYSQL_ALLOW_EMPTY_PASSWORD=yes
   ```
3. Go to **Settings** → **Deploy** → **Custom Start Command**
4. Set it to:

   ```bash
   mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;"
   ```

   (Replace password with your actual password)

5. Save and redeploy

## After Databases Are Created

1. Check the logs - you should see the databases listed
2. Delete the temporary service
3. Update Fineract's `FINERACT_HIKARI_JDBC_URL` to use `fineract_tenants`
4. Fineract should start successfully!
