# Create Fineract Databases - Railway Method

## The Problem

`mysql.railway.internal` is only accessible from within Railway's network, not from your local machine. We need to create the databases from inside Railway.

## Solution: Create a Temporary Service to Run SQL

### Step 1: Create a Temporary MySQL Client Service

1. In Railway, click **"+ New"** → **"Empty Service"**
2. Name it something like `db-setup` or `mysql-client`
3. Go to **Settings** → **Deploy**
4. Set **Source** to **"Docker Image"**
5. Enter: `mysql:8.0` (or `mariadb:latest`)
6. Click **Save**

### Step 2: Add Environment Variables

1. Go to the new service → **Variables** tab
2. Add these variables (use the values from your MySQL service):

```env
MYSQL_HOST=mysql.railway.internal
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP
MYSQL_DATABASE=railway
```

### Step 3: Set Custom Start Command

1. Go to **Settings** → **Deploy**
2. Find **"Custom Start Command"**
3. Set it to:

```bash
mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;"
```

**Note:** Replace `cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP` with your actual MySQL password.

### Step 4: Deploy and Check Logs

1. Railway will deploy the service
2. Go to **Logs** tab
3. You should see the databases being created and a list of all databases
4. Once done, you can delete this temporary service

## Alternative: Use Railway CLI (If You Have It)

If you have Railway CLI installed:

```bash
railway run mysql -h mysql.railway.internal -P 3306 -u root -p<password> -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default;"
```

## After Creating Databases

1. Go to **Fineract service** → **Variables**
2. Update `FINERACT_HIKARI_JDBC_URL` to:
   ```
   jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
   ```
3. Railway will redeploy Fineract
4. Wait 3-5 minutes for Fineract to start

## Quick Alternative: Check if Railway Has Database Tab

Before creating a temporary service, check if Railway MySQL has a built-in query interface:

1. Go to MySQL service
2. Look for a **"Database"** or **"Query"** tab
3. If it exists, you can run SQL directly there:
   ```sql
   CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
   CREATE DATABASE IF NOT EXISTS `fineract_default`;
   ```
