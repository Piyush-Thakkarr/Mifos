# Create Fineract Databases in PostgreSQL

## The Problem

Fineract needs the `fineract_tenants` database to exist before it can start. It can't auto-create it because it needs to connect to it first.

## Solution: Create Databases Manually

### Step 1: Create Temporary Service

1. Go to Railway → **"+ New"** → **Empty Service**
2. Name it: `create-db`
3. Go to **Settings** → **Deploy**
4. **Source**: Select **"Docker Hub"**
5. **Image**: `postgres:15`
6. **Variables** tab, add:
   - `PGPASSWORD=COmLBAnnRqMHQhXUZbzxYXqyDBmcfkst`
7. **Settings** → **Deploy** → **Custom Start Command**:
   ```bash
   sh -c "psql -h postgres.railway.internal -p 5432 -U postgres -d postgres -c 'CREATE DATABASE fineract_tenants' && psql -h postgres.railway.internal -p 5432 -U postgres -d postgres -c 'CREATE DATABASE fineract_default'"
   ```

### Step 2: Wait for Completion

1. Watch the logs
2. You should see the databases being created
3. Once it shows "Completed", delete the temporary service

### Step 3: Restart Fineract

1. Go to your **Fineract service**
2. Click **"Redeploy"** or wait for it to auto-restart
3. Fineract should now start successfully!

## Alternative: Use psql from Your Local Machine

If you have `psql` installed locally and can connect to Railway's PostgreSQL:

```bash
psql -h <your-railway-postgres-host> -p 5432 -U postgres -d postgres -c "CREATE DATABASE fineract_tenants; CREATE DATABASE fineract_default;"
```

But the temporary service method above is easier.
