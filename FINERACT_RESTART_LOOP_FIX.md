# Fix Fineract Restart Loop

## The Problem

Fineract keeps restarting in a loop. The logs show it initializing but then restarting before completing startup.

## Why This Happens

Fineract is likely crashing after the repository scanning phase, probably due to:

1. **Database connection failure** - Can't connect to MySQL
2. **Database not initialized** - Fineract needs to create its schema on first run
3. **Timeout during initialization** - Takes too long to initialize
4. **Memory/resource limits** - Not enough resources allocated

## How to Debug

### Step 1: Check the Full Error

The logs you're seeing are cut off. You need to see what happens AFTER the repository scanning:

1. In Railway, go to **Logs** tab
2. **Scroll to the very bottom** (most recent logs)
3. Look for:
   - `ERROR` messages
   - `Exception` messages
   - `Connection refused` or database errors
   - `OutOfMemoryError` or memory issues

### Step 2: Check Database Connection

Verify MySQL is accessible:

1. Go to your **MySQL service** in Railway
2. Check it's **"Online"**
3. Verify the connection details match what you set in Fineract variables

### Step 3: Common Fixes

#### Fix 1: Increase Startup Timeout

Fineract can take 3-5 minutes to initialize on first run. Railway might be killing it too early.

1. Go to Fineract service → **Settings** → **Deploy**
2. Check if there's a **healthcheck** or **timeout** setting
3. Increase timeout if possible

#### Fix 2: Check Database Initialization

Fineract needs to create its database schema. If the database is empty, it should auto-initialize, but this can take time.

**Check if database exists:**

- The database `railway` should exist (created by Railway)
- Fineract will create tables on first startup

#### Fix 3: Increase Resource Limits

Fineract needs resources to start:

1. Go to Fineract service → **Settings** → **Resource Limits**
2. Increase:
   - **Memory**: At least 1GB (you have 1GB, which should be enough)
   - **CPU**: At least 1 vCPU (you have 2, which is good)

#### Fix 4: Check for Database Connection Errors

Look in the logs for errors like:

- `Connection refused`
- `Access denied`
- `Unknown database`
- `Communications link failure`

If you see these, verify:

- MySQL host: `mysql.railway.internal`
- MySQL port: `3306`
- Database name: `railway`
- Username: `root`
- Password: Correct password

#### Fix 5: Disable Healthcheck Temporarily

If Railway has a healthcheck that's too aggressive:

1. Go to **Settings** → **Deploy**
2. Look for **Healthcheck Path**
3. Either remove it or set it to a path that doesn't exist (to disable)

## What to Look For in Logs

After the repository scanning, you should see one of these:

### Success (what we want):

```
Started ServerApplication
Tomcat started on port(s): 8443 (https)
```

### Database Connection Error:

```
Communications link failure
Connection refused
Access denied for user
```

### Database Initialization:

```
Creating database schema...
Liquibase migration...
```

### Memory Error:

```
OutOfMemoryError
```

## Next Steps

1. **Scroll to the bottom of the logs** and find the actual error
2. **Share the error message** - it will tell us exactly what's wrong
3. The error is likely happening after the repository scanning, so keep scrolling past those messages

## Quick Test

While waiting, you can test if MySQL is accessible from Fineract's perspective:

The logs should show database connection attempts. Look for any database-related errors after the repository scanning phase.
