# Fix Fineract Restart Loop - Healthcheck Issue

## The Problem

Fineract keeps restarting, but you only see a harmless logback warning. This suggests Railway's **healthcheck** is failing and killing the container before Fineract finishes starting.

## Why This Happens

Fineract takes **3-5 minutes** to fully start on first run because it needs to:

1. Connect to database
2. Initialize database schema (Liquibase migrations)
3. Create all tables and indexes
4. Start the web server

Railway's healthcheck might be checking too early and failing, causing restarts.

## Solution: Disable or Fix Healthcheck

### Option 1: Disable Healthcheck (Quick Fix)

1. Go to your Fineract service in Railway
2. **Settings** → **Deploy** tab
3. Find **"Healthcheck Path"** section
4. **Delete or clear** the healthcheck path (leave it empty)
5. Save

This will prevent Railway from killing Fineract during startup.

### Option 2: Set Correct Healthcheck Path

If you want to keep healthcheck, set it to Fineract's actual health endpoint:

1. Go to **Settings** → **Deploy** → **Healthcheck Path**
2. Set it to: `/fineract-provider/actuator/health`
3. Railway will wait for this endpoint to respond before considering it healthy

### Option 3: Increase Startup Time

Some Railway configurations have a startup timeout. Check:

1. **Settings** → **Deploy**
2. Look for any **timeout** or **startup timeout** settings
3. Increase to at least **300 seconds** (5 minutes)

## Additional Checks

### Check Restart Policy

1. Go to **Settings** → **Deploy** → **Restart Policy**
2. Make sure it's set to **"On Failure"** (not "Always")
3. **Max restart retries**: Set to a reasonable number (10 is fine)

### Check Resource Limits

Make sure Fineract has enough resources:

1. **Settings** → **Resource Limits**
2. **Memory**: At least 1GB (you have this)
3. **CPU**: At least 1 vCPU (you have 2, which is good)

## What to Expect After Fix

Once healthcheck is disabled/fixed:

1. Fineract will start up (takes 3-5 minutes on first run)
2. You'll see database initialization messages in logs
3. Eventually you'll see: `Started ServerApplication` or `Tomcat started on port(s): 8443`
4. Then it will stay running

## Monitor the Logs

After disabling healthcheck, watch the logs. You should see:

1. Repository scanning (you're already seeing this)
2. Database connection attempts
3. Liquibase migration messages (creating tables)
4. `Started ServerApplication` (success!)

If you see database connection errors, that's a different issue we can fix.

## Quick Action

**Right now, go disable the healthcheck** - that's most likely the issue!

1. Fineract service → Settings → Deploy
2. Find "Healthcheck Path"
3. Clear/delete it
4. Save
5. Wait 5 minutes and check logs
