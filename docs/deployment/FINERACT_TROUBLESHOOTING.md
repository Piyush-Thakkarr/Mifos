# Fineract Troubleshooting Guide

## Still Getting 502 Error?

If Fineract is still not starting after setting environment variables, follow these steps:

## Step 1: Check Railway Logs

1. Go to your Fineract service in Railway
2. Click on **"Logs"** tab
3. Look for error messages

### Common Issues:

#### Issue 1: Still seeing variable reference errors

- **Symptom**: `NumberFormatException: For input string: "${MYSQLPORT}"`
- **Fix**: Make sure you're using actual values, not `${MYSQLPORT}` etc.
- **Check**: Go to Variables tab and verify all values are actual numbers/strings, not variable references

#### Issue 2: Database connection errors

- **Symptom**: `Connection refused` or `Access denied`
- **Fix**: Verify MySQL service is running and credentials are correct
- **Check**:
  - MySQL service shows "Online" status
  - Host: `mysql.railway.internal`
  - Port: `3306`
  - Username: `root`
  - Password matches your MySQL service

#### Issue 3: Missing required variables

- **Symptom**: Various configuration errors
- **Fix**: Make sure ALL required variables are set

## Step 2: Verify All Required Variables Are Set

Go to **Variables** tab and ensure you have ALL of these:

### Required Variables Checklist:

- [ ] `FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver`
- [ ] `FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/railway`
- [ ] `FINERACT_HIKARI_USERNAME=root`
- [ ] `FINERACT_HIKARI_PASSWORD=<your-actual-password>`
- [ ] `FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal`
- [ ] `FINERACT_DEFAULT_TENANTDB_PORT=3306` (must be number, not string)
- [ ] `FINERACT_DEFAULT_TENANTDB_UID=root`
- [ ] `FINERACT_DEFAULT_TENANTDB_PWD=<your-actual-password>`
- [ ] `FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true`
- [ ] `FINERACT_NODE_ID=1`
- [ ] `FINERACT_TENANT_APPUSER=appuser`
- [ ] `FINERACT_TENANT_APPPASS=apppass`
- [ ] `PORT=8443`

## Step 3: Check MySQL Connection

Verify your MySQL service is accessible:

1. Go to your **MySQL service** in Railway
2. Check it's **"Online"**
3. Note the exact values from **Variables** tab:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

4. Make sure Fineract variables match these values

## Step 4: Common Fixes

### Fix 1: Remove Variable References

If you see any variable with `${...}`, replace it with the actual value:

❌ Wrong: `FINERACT_DEFAULT_TENANTDB_PORT=${MYSQLPORT}`
✅ Correct: `FINERACT_DEFAULT_TENANTDB_PORT=3306`

### Fix 2: Check Port is a Number

Make sure `FINERACT_DEFAULT_TENANTDB_PORT` is set to `3306` (number), not `"3306"` (string with quotes).

### Fix 3: Verify JDBC URL Format

The JDBC URL must be exactly:

```
jdbc:mariadb://mysql.railway.internal:3306/railway
```

Not:

- `jdbc:mariadb://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}` ❌
- `jdbc:mariadb://mysql.railway.internal:3306` (missing database) ❌

### Fix 4: Check Password Special Characters

If your MySQL password has special characters, make sure they're properly escaped in the JDBC URL and password fields.

## Step 5: Force Redeploy

After fixing variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** or wait for automatic redeploy
3. Watch the **Logs** tab for startup messages

## Step 6: What Success Looks Like

In the logs, you should see:

```
Started ServerApplication
Tomcat started on port(s): 8443 (https)
```

If you see this, Fineract is running! Test with:

```bash
curl https://fineract-production-6018.up.railway.app/fineract-provider/actuator/health
```

## Still Not Working?

Share the latest error from the **Logs** tab and I'll help debug further!
