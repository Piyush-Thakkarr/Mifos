# Fix Railway Fineract Configuration

## Current Issue

Your Fineract service is configured incorrectly:

- **Source**: Connected to GitHub repo (building from source)
- **Dockerfile Path**: `apache/fineract:latest` ❌ (This is a Docker image name, not a file path!)

## Solution: Switch to Docker Image

### Step 1: Disconnect GitHub Repo

1. In Railway, go to your **Fineract service**
2. Go to **"Settings"** → **"Deploy"** tab
3. Find **"Source"** section
4. Click **"Disconnect"** next to your GitHub repo

### Step 2: Use Docker Image Instead

1. After disconnecting, you'll see options to add a new source
2. Click **"Docker Image"** or **"Change Source"** → **"Docker Image"**
3. Enter: `apache/fineract:latest`
4. Click **"Save"** or **"Update"**

### Step 3: Verify Settings

After switching, your settings should look like:

- **Source**: `Docker Image: apache/fineract:latest` ✅
- **Port**: `8443` ✅
- **Public URL**: `fineract-production-6018.up.railway.app` ✅

### Step 4: Add Environment Variables

Go to **"Variables"** tab and add all the MySQL connection variables (as shown in FINERACT_RAILWAY_SETUP.md).

## Why This Works

- **Docker Image**: Railway pulls the pre-built official Fineract image
- **No Dockerfile needed**: The image is already built and ready
- **Faster deployment**: No build step required
- **More reliable**: Official image is tested and maintained

## Alternative: If You Want to Build from Source

If you really need to build from source (not recommended unless you have customizations):

1. **Keep GitHub repo connected**
2. **Create a Dockerfile** in your Fineract repo root:
   ```dockerfile
   FROM azul/zulu-openjdk-alpine:21
   WORKDIR /app
   COPY fineract-provider/build/libs/fineract-provider.jar app.jar
   EXPOSE 8443
   ENTRYPOINT ["java", "-jar", "app.jar"]
   ```
3. **Set Dockerfile Path** to: `Dockerfile` (not `apache/fineract:latest`!)
4. **Build the JAR first** before deploying

But honestly, just use the official Docker image - it's much simpler! 🚀
