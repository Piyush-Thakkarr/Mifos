# Fix Fineract Memory/Startup Issues

## The Problem

Fineract is restarting every ~30-40 seconds, consistently stopping after cache initialization. Healthcheck is disabled, so it's likely:

1. **Memory limit** - Fineract needs significant memory during startup
2. **Reflections scanning hanging** - The `file:/app/plugins/*` warnings suggest Reflections is scanning and might be hanging
3. **Railway resource limits** - Railway might be killing it due to resource constraints

## Solution 1: Increase Memory

1. Go to **Fineract service** → **Settings** → **Resources**
2. Increase **Memory** to at least **2GB** (2048 MB) or remove the limit
3. Save and redeploy

## Solution 2: Check Railway Logs for Kill Reason

1. Go to **Fineract service** → **Deploy Logs** tab
2. Look for messages like:
   - `Killed`
   - `Out of memory`
   - `OOMKilled`
   - `Container killed`
   - Any exit codes

## Solution 3: Check if Reflections is Hanging

The logs show Reflections warnings about `file:/app/plugins/*`. This scanning can take a long time. If it's hanging, Railway might kill it.

## Solution 4: Check Railway Service Limits

1. Go to **Fineract service** → **Settings**
2. Check for any **Restart Policy** or **Resource Limits**
3. Check if there's a **Timeout** setting

## Quick Test

Try increasing memory first - Fineract needs at least 1-2GB during startup, especially during cache initialization and Reflections scanning.
