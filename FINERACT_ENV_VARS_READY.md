# Fineract Environment Variables - Ready to Copy

## For Database Setup (Temporary Service)

**Custom Start Command** for the `db-setup` service:

```bash
sh -c "mysql -h mysql.railway.internal -P 3306 -u root -pqDQagugMqQNYeVUhAHdPKMOreAKuGgpx -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
```

## For Fineract Service (Main Service)

Copy these environment variables to your Fineract service:

```bash
# Database Connection (Tenant Store)
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=qDQagugMqQNYeVUhAHdPKMOreAKuGgpx

# Default Tenant Database Creation
FINERACT_DEFAULT_TENANTDB_HOSTNAME=mysql.railway.internal
FINERACT_DEFAULT_TENANTDB_PORT=3306
FINERACT_DEFAULT_TENANTDB_UID=root
FINERACT_DEFAULT_TENANTDB_PWD=qDQagugMqQNYeVUhAHdPKMOreAKuGgpx
FINERACT_DEFAULT_TENANTDB_NAME=fineract_default
FINERACT_DEFAULT_TENANTDB_IDENTIFIER=default
FINERACT_DEFAULT_TENANTDB_DESCRIPTION=Default Demo Tenant
FINERACT_DEFAULT_TENANTDB_CONNECTION_PARAMS=?useSSL=false&allowPublicKeyRetrieval=true

# Server Settings
PORT=8443
FINERACT_SERVER_SSL_ENABLED=true
FINERACT_NODE_ID=1

# Optional: Memory Settings
JAVA_TOOL_OPTIONS=-Xmx1G -XX:MinRAMPercentage=25 -XX:MaxRAMPercentage=80
```

## Quick Steps

1. **Create databases** (temporary service):
   - Use the command above in Custom Start Command
   - Wait for completion
   - Delete the temporary service

2. **Deploy Fineract**:
   - Docker Hub image: `apache/fineract:latest`
   - Port: `8443`
   - Add all variables above
   - **Disable healthcheck** (Settings → Healthcheck → clear path)

3. **Wait 5-8 minutes** for first startup
