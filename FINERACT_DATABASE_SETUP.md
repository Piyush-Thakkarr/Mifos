# Fineract Database Setup - Critical!

## The Problem

Fineract requires **TWO specific databases** to exist before it can start:

1. `fineract_tenants` - Main tenants database
2. `fineract_default` - Default tenant database

Your MySQL service only has a database called `railway`. Fineract is probably trying to connect to `fineract_tenants` which doesn't exist, causing it to crash and restart.

## Solution: Create the Required Databases

You need to create these databases in your MySQL service. Here's how:

### Option 1: Using Railway MySQL Console (Easiest)

1. Go to your **MySQL service** in Railway
2. Click on **"Database"** tab (or look for a "Connect" or "Query" option)
3. If Railway has a built-in query console, use it
4. Run these SQL commands:

```sql
CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
CREATE DATABASE IF NOT EXISTS `fineract_default`;
```

### Option 2: Connect via MySQL Client

If Railway doesn't have a built-in console, connect using a MySQL client:

1. Get your MySQL connection details from Railway:
   - Host: `mysql.railway.internal` (or the public URL if available)
   - Port: `3306`
   - User: `root`
   - Password: Your MySQL password
   - Database: `railway` (temporary, just to connect)

2. Connect using MySQL client or any MySQL tool

3. Run:

```sql
CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
CREATE DATABASE IF NOT EXISTS `fineract_default`;
```

### Option 3: Update Fineract to Use Existing Database

Alternatively, you can configure Fineract to use your existing `railway` database, but this is more complex and not recommended.

## Update Fineract Environment Variables

After creating the databases, make sure your Fineract variables point to the correct database:

**Current (probably wrong):**

```
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/railway
```

**Should be:**

```
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
```

## Complete Variable List

After creating databases, verify these variables in your Fineract service:

```env
FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=<your-mysql-password>

FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=<your-mysql-password>
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

FINERACT_NODE_ID=1
FINERACT_TENANT_APPUSER=appuser
FINERACT_TENANT_APPPASS=apppass

PORT=8443
```

**Important:** The JDBC URL should point to `fineract_tenants`, not `railway`!

## After Creating Databases

1. Update the JDBC URL to use `fineract_tenants`
2. Railway will automatically redeploy
3. Wait 3-5 minutes for Fineract to initialize
4. Check logs - you should see database initialization messages
5. Eventually: `Started ServerApplication`

## Quick Test

To verify databases were created, you can check in MySQL:

```sql
SHOW DATABASES;
```

You should see:

- `fineract_tenants`
- `fineract_default`
- `railway` (your original database)
