# Check Deploy Logs for Restart Reason

## The Problem

Fineract is restarting every ~30-40 seconds, consistently stopping after cache initialization. No errors are shown in the regular logs, which suggests Railway is killing it.

## What to Check

1. **Go to Fineract service** → **Deploy Logs** tab (NOT the regular Logs tab)
2. Look for messages like:
   - `Healthcheck failed!`
   - `1/1 replicas never became healthy!`
   - `Out of memory`
   - `Killed`
   - Any error messages from Railway

## Most Likely Causes

### 1. Healthcheck Still Enabled

- Even if you cleared the healthcheck path, Railway might have a default
- Check **Settings** → **Healthcheck** → make sure path is **completely empty**

### 2. Memory Limit

- Fineract needs significant memory during startup
- Check **Settings** → **Resources** → increase memory if limited

### 3. Railway Auto-Restart

- Railway might be auto-restarting due to no response
- Check if there's a restart policy enabled

## What the Logs Show

The logs show Fineract consistently:

1. Starts up ✅
2. Initializes Spring ✅
3. Scans repositories ✅
4. Initializes cache ⚠️ (gets stuck here)
5. Restarts (no error shown)

This pattern suggests Railway is killing it, not Fineract crashing.

## Next Steps

1. Check **Deploy Logs** tab for Railway's reason
2. Double-check **Healthcheck** is completely disabled
3. Check **Resources** for memory limits
4. Share what you see in **Deploy Logs**
