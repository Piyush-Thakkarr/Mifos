# Fix Driver Environment Variable Name

## The Problem

The correct Fineract environment variable name for the JDBC driver is:

```
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME
```

**NOT** `FINERACT_HIKARI_DRIVER_CLASS_NAME` (missing `_SOURCE_`)

## Fix in Railway

1. Go to **Fineract service** → **Variables** tab
2. Look for any variable with `DRIVER` in the name
3. If you see `FINERACT_HIKARI_DRIVER_CLASS_NAME`, **delete it** or **rename it**
4. Add/Update the variable:
   - **Name**: `FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME`
   - **Value**: `org.mariadb.jdbc.Driver`
5. Save

## Correct Variable Names

Based on Fineract source code, the correct variable names are:

```
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.mariadb.jdbc.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:mariadb://mysql.railway.internal:3306/fineract_tenants
FINERACT_HIKARI_USERNAME=root
FINERACT_HIKARI_PASSWORD=<your-mysql-password>
```

## Why This Matters

Fineract's `application.properties` looks for:

```properties
spring.datasource.hikari.driverClassName=${FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME:org.mariadb.jdbc.Driver}
```

If the variable name is wrong, Fineract will use the default value, but it's better to be explicit and use the correct name.
