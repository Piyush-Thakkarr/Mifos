# Create Fineract Databases in Railway MySQL

## Quick Steps

You need to create two databases in your MySQL service. Here's how:

### Option 1: Using Railway's MySQL Query Interface (If Available)

1. **Go to your MySQL service** in Railway
2. Look for a **"Query"**, **"Console"**, or **"Database"** tab
3. If you see a SQL query interface, run:
   ```sql
   CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
   CREATE DATABASE IF NOT EXISTS `fineract_default`;
   ```

### Option 2: Connect via MySQL Client (Recommended)

If Railway doesn't have a built-in query interface, connect using a MySQL client:

#### Step 1: Get MySQL Connection Details

From your MySQL service Variables tab, note:

- **Host**: `mysql.railway.internal` (for private network) or the public URL
- **Port**: `3306`
- **User**: `root`
- **Password**: Your MySQL password
- **Database**: `railway` (temporary, just to connect)

#### Step 2: Connect and Create Databases

**Using MySQL command line:**

```bash
mysql -h mysql.railway.internal -P 3306 -u root -p
# Enter your password when prompted
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
CREATE DATABASE IF NOT EXISTS `fineract_default`;
SHOW DATABASES;  -- Verify they were created
EXIT;
```

**Or using a MySQL GUI tool** (like MySQL Workbench, DBeaver, TablePlus):

- Connect using the credentials above
- Run the CREATE DATABASE commands

**Or using a one-liner:**

```bash
mysql -h mysql.railway.internal -P 3306 -u root -p<password> -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default;"
```

### Option 3: Use Railway's Public Network (If Available)

If Railway MySQL has a public connection URL:

1. Click on MySQL service → **"Connect"** button
2. Look for **"Public Network"** tab in the connection modal
3. Get the public connection string
4. Connect using that and create the databases

## After Creating Databases

### Step 1: Update Fineract JDBC URL

1. Go to **Fineract service** → **Variables** tab
2. Find `FINERACT_HIKARI_JDBC_URL`
3. Change it from:
   ```
   jdbc:mariadb://mysql.railway.internal:3306/railway
   ```
   To:
   ```
   jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
   ```

### Step 2: Verify All Variables

Make sure these are set correctly:

```env
FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=<your-actual-mysql-password>

FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=<your-actual-mysql-password>
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

FINERACT_NODE_ID=1
FINERACT_TENANT_APPUSER=appuser
FINERACT_TENANT_APPPASS=apppass

PORT=8443
```

### Step 3: Wait for Fineract to Start

1. Railway will automatically redeploy after you update variables
2. Wait 3-5 minutes for Fineract to initialize
3. Check logs - you should see:
   - Database connection messages
   - Liquibase migration (creating tables)
   - `Started ServerApplication` (success!)

## Quick Test Command

After Fineract starts, test it:

```bash
curl https://fineract-production-6018.up.railway.app/fineract-provider/actuator/health
```

You should get a JSON response with status information.
