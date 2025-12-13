# Fineract PostgreSQL Environment Variables - Ready to Use

## Copy These Variables to Your Fineract Service

Go to **Fineract service** → **Variables** tab and add these:

```bash
# Database Connection (Tenant Store)
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.postgresql.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://postgres.railway.internal:5432/fineract_tenants
FINERACT_HIKARI_USERNAME=postgres
FINERACT_HIKARI_PASSWORD=COmLBAnnRqMHQhXUZbzxYXqyDBmcfkst

# Default Tenant Database Creation
FINERACT_DEFAULT_TENANTDB_HOSTNAME=postgres.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=5432
FINERACT_DEFAULT_TENANTDB_UID=postgres
FINERACT_DEFAULT_TENANTDB_PWD=COmLBAnnRqMHQhXUZbzxYXqyDBmcfkst
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

## Important Notes

1. **${{RAILWAY_PRIVATE_DOMAIN}}** - This should automatically resolve to your PostgreSQL internal hostname. If it doesn't work, check your PostgreSQL service's Variables tab for the actual `PGHOST` value.

2. **If Variable References Don't Work**: Replace `${{RAILWAY_PRIVATE_DOMAIN}}` with the actual value from your PostgreSQL service. You can find it in:
   - PostgreSQL service → Variables → `PGHOST` or `RAILWAY_PRIVATE_DOMAIN`
   - It should be something like: `postgres.railway.internal` or similar

3. **Fineract will auto-create databases** - You don't need to create `fineract_tenants` or `fineract_default` manually. Fineract will create them during startup.

## Quick Deployment Steps

1. **Create Fineract service**:
   - "+ New" → Empty Service
   - Name: `fineract`
   - Settings → Deploy → Source: "Docker Hub"
   - Image: `apache/fineract:latest`
   - Port: `8443`

2. **Add all variables above** to the Variables tab

3. **Connect to PostgreSQL**:
   - Fineract service → Settings → Networking
   - Click "Connect" next to your PostgreSQL service
   - This shares the connection variables automatically

4. **Disable healthcheck**:
   - Settings → Healthcheck
   - Clear the Healthcheck Path (leave empty)

5. **Wait 5-8 minutes** for first startup

## Troubleshooting

### If ${{RAILWAY_PRIVATE_DOMAIN}} doesn't work:

1. Go to **PostgreSQL service** → **Variables** tab
2. Look for `PGHOST` or `RAILWAY_PRIVATE_DOMAIN`
3. Copy the actual value (e.g., `postgres.railway.internal`)
4. Replace `${{RAILWAY_PRIVATE_DOMAIN}}` with that value in:
   - `FINERACT_HIKARI_JDBC_URL`
   - `FINERACT_DEFAULT_TENANTDB_HOSTNAME`

### Alternative: Use Connection String

If Railway provides a `DATABASE_URL`, you can extract the host from it, or use:

- Check `PGHOST` in PostgreSQL variables
- Usually it's something like: `postgres.railway.internal` or `containers-us-west-xxx.railway.app`
