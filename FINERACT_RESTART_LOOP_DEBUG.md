# Debug Fineract Restart Loop

## The Problem

Fineract is restarting every ~40 seconds, which suggests:

1. Railway's healthcheck is killing it (most likely)
2. It's crashing due to a database connection issue
3. It's running out of memory

## Step 1: Check for Errors

Scroll down in the logs to see if there are any error messages after the startup logs. Look for:

- Database connection errors
- `Connection refused`
- `Access denied`
- `Unknown database`
- Out of memory errors

## Step 2: Verify Healthcheck is Disabled

1. Go to **Fineract service** → **Settings** → **Healthcheck**
2. Make sure **Healthcheck Path** is **empty** or set to `/fineract-provider/actuator/health`
3. If it's set to `/` or something else, **clear it** or disable it

## Step 3: Verify JDBC URL

1. Go to **Fineract service** → **Variables** tab
2. Check `FINERACT_HIKARI_JDBC_URL`
3. It should be:
   ```
   jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
   ```
   **NOT** `jdbc:mariadb://mysql.railway.internal:3306/railway`

## Step 4: Check All Database Variables

Make sure these are set correctly (use actual values, not `${VARIABLE}` references):

```
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_JDBC_USERNAME=root
FINERACT_HIKARI_JDBC_PASSWORD=<your-actual-mysql-password>
FINERACT_HIKARI_JDBC_DRIVER=org.mariadb.jdbc.Driver
```

## Step 5: Increase Startup Time

If healthcheck is the issue, you can:

1. Disable healthcheck completely (recommended for first startup)
2. Or set a longer healthcheck timeout

## Step 6: Check Memory

If it's a memory issue:

1. Railway might be killing it due to memory limits
2. Check Railway's resource limits for your service
3. Consider upgrading if needed

## What to Look For in Logs

After scrolling down, you should see one of these:

### If Database Connection Fails:

```
Caused by: java.sql.SQLException: Access denied for user...
```

or

```
Unknown database 'fineract_tenants'
```

### If Healthcheck Kills It:

You'll see the container restarting without any error messages

### If It's Working:

You'll eventually see:

```
Started ServerApplication in X seconds
```

or

```
Tomcat started on port(s): 8443
```

## Quick Fix

1. **Disable healthcheck** (Settings → Healthcheck → clear the path)
2. **Verify JDBC URL** points to `fineract_tenants`
3. **Wait 5-10 minutes** for first startup (database migrations take time)
4. **Check logs** for "Started ServerApplication" or errors
