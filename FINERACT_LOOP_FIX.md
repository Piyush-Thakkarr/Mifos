# Fix Fineract Restart Loop

## The Problem

Fineract is restarting every ~40-50 seconds, which suggests:

1. **Healthcheck is still enabled** (most likely)
2. **Memory issues** (Railway killing it due to memory limits)
3. **Crash during startup** (check for errors after cache initialization)

## Step 1: Verify Healthcheck is Disabled

1. Go to **Fineract service** → **Settings** → **Healthcheck**
2. **Make absolutely sure** the **Healthcheck Path** field is **completely empty**
3. If there's ANY text in it (even `/fineract-provider/actuator/health`), **delete it**
4. **Save**

## Step 2: Check for Errors

Scroll down in the logs to see if there are any error messages after the cache initialization. Look for:

- `OutOfMemoryError`
- `Connection refused`
- `Access denied`
- Any `ERROR` or `Exception` messages

## Step 3: Check Memory Limits

1. Go to **Fineract service** → **Settings** → **Resources**
2. Check if there's a memory limit set
3. If memory is limited, try increasing it or removing the limit

## Step 4: Check Railway's Deploy Logs

Look at the **Deploy Logs** tab (not just the regular logs) to see if Railway is killing the service with a specific reason.

## Quick Fix

**Most likely cause:** Healthcheck is still enabled. Double-check that the Healthcheck Path is completely empty (not just set to a different value).

If healthcheck is disabled and it's still looping, check the logs for errors after the cache initialization phase.
