# Quick Fix: Create Fineract Databases

## Step 1: Close the Modal

Close the "Connect to MySQL" modal (click the X) - we don't need it right now.

## Step 2: Create the Databases

You need to create two databases. Railway MySQL might not have a built-in query interface, so we'll use a MySQL client from your local machine.

### Get MySQL Connection Details

1. In Railway, go to your **MySQL service**
2. Click on **"Variables"** tab
3. Note down these values:
   - `MYSQLHOST` (probably `mysql.railway.internal` or a public URL)
   - `MYSQLPORT` (probably `3306`)
   - `MYSQLUSER` (probably `root`)
   - `MYSQLPASSWORD` (your password)
   - `MYSQLDATABASE` (probably `railway`)

### Connect and Create Databases

**Option A: If MySQL has a public URL**

1. In MySQL service, check if there's a **"Public Network"** tab in the connection modal
2. Get the public connection string
3. Use it to connect

**Option B: Connect via MySQL client (Recommended)**

Run this command on your local machine (replace with your actual values):

```bash
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;"
```

**Example** (if using public network):

```bash
mysql -h <public-host> -P 3306 -u root -p<password> -e "CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;"
```

**Or if you need to connect interactively:**

```bash
mysql -h <host> -P 3306 -u root -p
# Enter password when prompted
# Then run:
CREATE DATABASE IF NOT EXISTS `fineract_tenants`;
CREATE DATABASE IF NOT EXISTS `fineract_default`;
SHOW DATABASES;
EXIT;
```

## Step 3: Update Fineract Variables

After creating databases:

1. Go to **Fineract service** → **Variables** tab
2. Find `FINERACT_HIKARI_JDBC_URL`
3. Change it to:

   ```
   jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
   ```

   (Change from `railway` to `fineract_tenants`)

4. Save - Railway will redeploy automatically

## Step 4: Wait and Check

1. Wait 3-5 minutes for Fineract to start
2. Check logs - look for `Started ServerApplication`
3. Test: `curl https://fineract-production-6018.up.railway.app/fineract-provider/actuator/health`

## If You Can't Connect to MySQL

If you can't connect from your local machine (maybe MySQL is only accessible via private network), we might need to:

1. Create a temporary service/script to create the databases
2. Or check if Railway has another way to run SQL

Let me know what connection details you see in the MySQL Variables tab!
