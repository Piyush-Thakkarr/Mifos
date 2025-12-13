# Fix MySQL Command - Correct Syntax

## The Problem

Railway is misinterpreting the command and adding a `-R` option that doesn't exist.

## Solution: Use Proper Command Format

### Option 1: Use Sh -c Wrapper (Recommended)

1. Go to your temporary service → **Settings** → **Deploy**
2. **Custom Start Command** should be:

   ```bash
   sh -c "mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
   ```

   **Important:** Replace `cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP` with your actual MySQL password.

3. Make sure you have the variable:
   - `MYSQL_ALLOW_EMPTY_PASSWORD=yes`

### Option 2: Use Environment Variables

Instead of putting the password in the command, use environment variables:

1. **Variables tab**, add:

   ```
   MYSQL_HOST=mysql.railway.internal
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=cfRgPmDIyzvgxrwinylzCuZDNPkrPWHP
   MYSQL_ALLOW_EMPTY_PASSWORD=yes
   ```

2. **Custom Start Command**:
   ```bash
   sh -c "mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
   ```

### Option 3: Use Alpine with MySQL Client

If the MySQL image keeps having issues, use Alpine:

1. **Source**: Docker Image
2. **Image**: `alpine:latest`
3. **Custom Start Command**:
   ```bash
   sh -c "apk add --no-cache mysql-client && mysql -h mysql.railway.internal -P 3306 -u root -pcfRgPmDIyzvgxrwinylzCuZDNPkrPWHP -e 'CREATE DATABASE IF NOT EXISTS fineract_tenants; CREATE DATABASE IF NOT EXISTS fineract_default; SHOW DATABASES;'"
   ```

## Important Notes

- Use **single quotes** inside the `-e` flag for SQL commands
- Wrap the entire command in `sh -c "..."` to ensure proper parsing
- Make sure password has no special characters that need escaping
- The `-p` flag should be directly followed by the password (no space): `-ppassword`

## After It Works

Check logs - you should see:

- Database creation messages
- List of databases including `fineract_tenants` and `fineract_default`

Then delete the temporary service and update Fineract's JDBC URL!
