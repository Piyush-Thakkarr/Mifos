# Deploy Fineract with PostgreSQL on Railway

## Why PostgreSQL?

- **Simpler setup** - No need to create databases manually
- **Better supported** - PostgreSQL is well-tested with Fineract
- **Railway native** - PostgreSQL is a first-class service on Railway

## Step 1: Create PostgreSQL Database

1. Go to Railway → **"+ New"** → **Database** → **Add PostgreSQL**
2. Wait for it to start
3. Note the connection details from **Variables** tab

## Step 2: Create Fineract Databases (Optional - Fineract can auto-create)

**Option A: Let Fineract create them (Recommended)**

Just skip this step - Fineract will create the databases automatically!

**Option B: Create manually**

1. Create a temporary service:
   - **"+ New"** → **Empty Service**
   - Name: `db-setup`
   - **Settings** → **Deploy** → **Source**: "Docker Hub"
   - **Image**: `postgres:15`
   - **Variables** tab, add:
     - `PGPASSWORD=${{Postgres.PGPASSWORD}}`
   - **Settings** → **Deploy** → **Custom Start Command**:
     ```bash
     sh -c "psql -h ${{Postgres.PGHOST}} -p ${{Postgres.PGPORT}} -U ${{Postgres.PGUSER}} -d postgres -c 'CREATE DATABASE fineract_tenants; CREATE DATABASE fineract_default;'"
     ```
2. Wait for completion
3. Delete the temporary service

## Step 3: Deploy Fineract

1. Click **"+ New"** → **Empty Service**
2. Name it: `fineract`
3. Go to **Settings** → **Deploy**
4. **Source**: Select **"Docker Hub"**
5. **Image**: `apache/fineract:latest`
6. **Port**: `8443`

## Step 4: Set Environment Variables

Go to **Variables** tab and add these. **Replace the PostgreSQL connection values** with your actual Railway PostgreSQL variables:

```bash
# Database Connection (Tenant Store)
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.postgresql.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/fineract_tenants
FINERACT_HIKARI_USERNAME=${{Postgres.PGUSER}}
FINERACT_HIKARI_PASSWORD=${{Postgres.PGPASSWORD}}

# Default Tenant Database Creation
FINERACT_DEFAULT_TENANTDB_HOSTNAME=${{Postgres.PGHOST}}
FINERACT_DEFAULT_TENANTDB_PORT=${{Postgres.PGPORT}}
FINERACT_DEFAULT_TENANTDB_UID=${{Postgres.PGUSER}}
FINERACT_DEFAULT_TENANTDB_PWD=${{Postgres.PGPASSWORD}}
FINERACT_DEFAULT_TENANTDB_NAME=fineract_default
FINERACT_DEFAULT_TENANTDB_IDENTIFIER=default
FINERACT_DEFAULT_TENANTDB_DESCRIPTION=Default Demo Tenant
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?sslmode=disable

# Server Settings
PORT=8443
FINERACT_SERVER_SSL_ENABLED=true
FINERACT_NODE_ID=1

# Optional: Memory Settings
JAVA_TOOL_OPTIONS=-Xmx1G -XX:MinRAMPercentage=25 -XX:MaxRAMPercentage=80
```

**Important**: Railway's variable references (`${{Postgres.PGHOST}}`) should work, but if they don't resolve, use the actual values from your PostgreSQL service's Variables tab.

## Step 5: Connect Services

1. Go to **Fineract service** → **Settings** → **Networking**
2. Click **"Connect"** next to your **PostgreSQL** service
3. This will automatically share the PostgreSQL connection variables

## Step 6: Disable Healthcheck

1. Go to **Settings** → **Healthcheck**
2. **Clear** the **Healthcheck Path** field (leave empty)
3. **Save**

## Step 7: Wait for Startup

1. Fineract will start automatically
2. First startup takes **5-8 minutes** (database migrations)
3. Watch the logs - you should see:
   - `HikariPool-1 - Starting...`
   - `Tenant store upgrade finished`
   - `Started ServerApplication`

## Step 8: Get Fineract URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** or use the provided domain
3. Your Fineract API will be at: `https://your-domain.up.railway.app/fineract-provider/api/v1`

## Troubleshooting

### Variable References Not Working

If `${{Postgres.PGHOST}}` doesn't work, use actual values:

1. Go to **PostgreSQL service** → **Variables** tab
2. Copy the actual values for:
   - `PGHOST` (e.g., `postgres.railway.internal`)
   - `PGPORT` (usually `5432`)
   - `PGUSER` (usually `postgres`)
   - `PGPASSWORD` (your password)

3. Replace in the environment variables:
   ```bash
   FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://postgres.railway.internal:5432/fineract_tenants
   FINERACT_HIKARI_USERNAME=postgres
   FINERACT_HIKARI_PASSWORD=your_actual_password
   ```

### Fineract Keeps Restarting

- **Check**: Healthcheck is disabled
- **Check**: PostgreSQL service is running
- **Check**: Connection variables are correct

## That's It!

Your Fineract should now be running with PostgreSQL. Test it:

```bash
curl -k https://your-fineract-domain.up.railway.app/fineract-provider/actuator/health
```

Should return: `{"status":"UP"}`
