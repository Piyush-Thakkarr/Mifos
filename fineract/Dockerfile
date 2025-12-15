# Dockerfile for Fineract on Render
# Uses the official Apache Fineract Docker image
FROM apache/fineract:latest

# Expose port (Render uses $PORT environment variable)
# Fineract will bind to the port specified in FINERACT_SERVER_PORT
EXPOSE 8443

# The official image already has the entrypoint configured
# Environment variables are passed through from Render
# FINERACT_SERVER_PORT will be set to $PORT by Render

