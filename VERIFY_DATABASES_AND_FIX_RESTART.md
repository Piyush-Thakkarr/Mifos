# Verify Databases and Fix Fineract Restart Loop

## The Issue

Fineract is connecting to PostgreSQL (`HikariPool-1 - Start completed`) but still restarting. This could mean:

1. Databases exist but migrations are taking too long (healthcheck killing it)
2. Databases weren't created in the correct PostgreSQL instance

## Step 1: Verify Databases Exist

### Option A: Check via Temporary Service

1. Create a new temporary service:
   - **Name**: `verify-db`
   - **Source**: Docker Hub
   - **Image**: `postgres:15`
   - **Variables**:
     - `PGPASSWORD=COmLBAnnRqMHQhXUZbzxYXqyDBmcfkst`
   - **Custom Start Command**:
     ```bash
     sh -c "psql -h postgres.railway.internal -p 5432 -U postgres -d postgres -c 'SELECT datname FROM pg_database WHERE datname IN (\"fineract_tenants\", \"fineract_default\");'"
     ```

2. Check the logs - you should see:
   ```
   fineract_tenants
   fineract_default
   ```

### Option B: Re-create Databases (If They Don't Exist)

If the databases don't exist, create them again:

1. Create temporary service:
   - **Name**: `create-db-again`
   - **Source**: Docker Hub
   - **Image**: `postgres:15`
   - **Variables**:
     - `PGPASSWORD=COmLBAnnRqMHQhXUZbzxYXqyDBmcfkst`
   - **Custom Start Command**:
     ```bash
     sh -c "psql -h postgres.railway.internal -p 5432 -U postgres -d postgres -c 'CREATE DATABASE fineract_tenants;' && psql -h postgres.railway.internal -p 5432 -U postgres -d postgres -c 'CREATE DATABASE fineract_default;'"
     ```

## Step 2: Disable Healthcheck (If Still Restarting)

If databases exist but Fineract still restarts, the healthcheck is likely killing it during migrations:

1. Go to **Fineract service** → **Settings** → **Healthcheck**
2. **Clear/Delete** the healthcheck path (leave it empty)
3. Click **Save**
4. Fineract will auto-restart

## Step 3: Wait for Migrations

Fineract's first startup can take **5-10 minutes** due to database migrations. Watch the logs for:

✅ **Good signs:**

- `HikariPool-1 - Start completed`
- `Upgrading tenant store DB`
- `Tenant store upgrade finished`
- `Started ServerApplication`

❌ **Bad signs:**

- `FATAL: database "fineract_tenants" does not exist`
- `Healthcheck failed!`
- `Killed` (memory issue)

## Step 4: Check Memory (If Still Failing)

If it's still restarting after 10 minutes:

1. Go to **Fineract service** → **Settings** → **Resources**
2. Increase memory to **2GB** (if available)
3. Click **Save**

## Summary

1. Verify databases exist
2. Disable healthcheck
3. Wait 5-10 minutes for migrations
4. Check logs for success messages
