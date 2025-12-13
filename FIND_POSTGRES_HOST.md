# Find PostgreSQL Hostname for Fineract

## Step 1: Get the Actual PostgreSQL Hostname

1. Go to your **Postgres** service in Railway
2. Click on **Postgres** service
3. Go to **Variables** tab
4. Look for one of these variables:
   - `PGHOST` - This is what we need!
   - `RAILWAY_PRIVATE_DOMAIN` - Alternative
   - `DATABASE_URL` - Can extract hostname from this

## Step 2: Common PostgreSQL Hostnames on Railway

Railway PostgreSQL hostnames are usually one of these formats:

- `postgres.railway.internal`
- `containers-us-west-xxx.railway.app` (or similar region)
- A specific internal domain

## Step 3: Update Fineract Environment Variables

Once you have the actual hostname, update these variables in your **Fineract service**:

Replace `${{RAILWAY_PRIVATE_DOMAIN}}` with the actual hostname value.

For example, if `PGHOST` is `postgres.railway.internal`, use:

```bash
FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://postgres.railway.internal:5432/fineract_tenants
FINERACT_DEFAULT_TENANTDB_HOSTNAME=postgres.railway.internal
```

## Alternative: Check DATABASE_URL

If you see `DATABASE_URL` in PostgreSQL variables, it looks like:

```
postgresql://postgres:password@hostname:5432/database
```

Extract the hostname from between `@` and `:5432`.

## Quick Check

Can you tell me what value you see for `PGHOST` in your PostgreSQL service Variables tab? Then I'll give you the exact environment variables to use.
