# Fix Fineract Healthcheck Timeout

## The Problem

Railway's healthcheck is killing Fineract before it finishes database migrations. The healthcheck times out after 5 minutes, but Fineract's first startup (with database migrations) can take 5-10 minutes.

## Solution: Disable Healthcheck (Recommended)

1. Go to **Fineract service** → **Settings** → **Healthcheck**
2. **Clear** the **Healthcheck Path** field (leave it empty)
3. **Save**

This will allow Fineract to complete its migrations without being killed.

## Alternative: Increase Timeout

If you want to keep the healthcheck enabled:

1. Go to **Fineract service** → **Settings** → **Healthcheck**
2. Set **Healthcheck Path** to: `/fineract-provider/actuator/health`
3. Increase **Timeout** to at least **10 minutes** (600 seconds) if Railway allows
4. **Save**

## After Fineract Starts

Once Fineract is running successfully, you can optionally re-enable the healthcheck with a longer timeout for production monitoring.

## Why This Happens

Fineract's first startup:

1. Connects to database (30 seconds)
2. Runs Liquibase migrations for `fineract_tenants` (1-2 minutes)
3. Runs Liquibase migrations for `fineract_default` (3-5 minutes)
4. Starts Tomcat server (30 seconds)

**Total: 5-8 minutes** - longer than Railway's default 5-minute healthcheck timeout.
