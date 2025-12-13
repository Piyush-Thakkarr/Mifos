# Fix Fineract Environment Variables

## The Problem

Fineract is crashing because it's receiving the literal string `"${MYSQLPORT}"` instead of the actual port number `3306`.

**Error:**

```
Failed to convert java.lang.String to java.lang.Integer
(caused by java.lang.NumberFormatException: For input string: "${MYSQLPORT}")
```

## The Solution

Railway variable references (like `${MYSQLPORT}`) don't always work in environment variables. Use **actual values** instead.

## Correct Environment Variables

Go to your Fineract service → **Variables** tab and set these **exact values**:

### Database Connection Variables:

```env
FINERACT_HIKARI_DRIVER_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/railway
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP
```

### Tenant Database Configuration:

```env
FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true
```

### Fineract Configuration:

```env
FINERACT_NODE_ID=1
FINERACT_TENANT_APPUSER=appuser
FINERACT_TENANT_APPPASS=apppass
```

### Port:

```env
PORT=8443
```

## Important Notes

1. **Use actual values**, not variable references like `${MYSQLPORT}`
2. **Host**: `mysql.railway.internal` (Railway's internal hostname)
3. **Port**: `3306` (standard MySQL port)
4. **Database**: `railway` (from your MySQL service)
5. **User**: `root`
6. **Password**: Your actual MySQL password

## After Setting Variables

1. Railway will automatically redeploy
2. Check the **Logs** tab - Fineract should start successfully
3. Wait for: `Started ServerApplication` in the logs
4. Test: `curl https://fineract-production-6018.up.railway.app/fineract-provider/actuator/health`

## If You Need to Update MySQL Credentials Later

If your MySQL password or connection details change, update these variables with the new values directly (not using variable references).
