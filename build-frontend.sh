#!/bin/bash
# Build script for Angular frontend on Render

set -e

echo "Installing dependencies..."
npm ci --legacy-peer-deps

echo "Generating environment file..."
# Create env.js from template with Render environment variables
cat > src/assets/env.js << EOF
(function (window) {
  window['env'] = window['env'] || {};

  // BackEnd Environment variables
  window['env']['fineractApiUrls'] = '${FINERACT_API_URLS:-https://localhost:8443}';
  window['env']['fineractApiUrl'] = '${FINERACT_API_URL:-https://localhost:8443}';
  window['env']['apiProvider'] = '${FINERACT_API_PROVIDER:-/fineract-provider/api}';
  window['env']['apiVersion'] = '${FINERACT_API_VERSION:-/v1}';
  window['env']['fineractPlatformTenantId'] = '${FINERACT_PLATFORM_TENANT_IDENTIFIER:-default}';
  window['env']['fineractPlatformTenantIds'] = '${FINERACT_PLATFORMS_TENANTS_IDENTIFIER:-default}';

  // Client Portal Django API URL
  window['env']['djangoApiUrl'] = '${DJANGO_API_URL:-http://localhost:8000}';

  // Language Environment variables
  window['env']['defaultLanguage'] = '${MIFOS_DEFAULT_LANGUAGE:-en-US}';
  window['env']['supportedLanguages'] = '${MIFOS_SUPPORTED_LANGUAGES:-en-US}';
  window['env']['preloadClients'] = '${MIFOS_PRELOAD_CLIENTS:-true}';
  window['env']['defaultCharDelimiter'] = '${MIFOS_DEFAULT_CHAR_DELIMITER:-,}';
  window['env']['allowServerSwitch'] = '${MIFOS_ALLOW_SERVER_SWITCH_SELECTOR:-true}';
  window['env']['displayBackEndInfo'] = '${MIFOS_DISPLAY_BACKEND_INFO:-true}';
  window['env']['displayTenantSelector'] = '${MIFOS_DISPLAY_TENANT_SELECTOR:-true}';
  window['env']['waitTimeForNotifications'] = '${MIFOS_WAIT_TIME_FOR_NOTIFICATIONS:-60}';
  window['env']['waitTimeForCOBCatchUp'] = '${MIFOS_WAIT_TIME_FOR_CATCHUP:-30}';
  window['env']['sessionIdleTimeout'] = '${MIFOS_SESSION_IDLE_TIMEOUT:-300000}';
  window['env']['oauthServerEnabled'] = '${MIFOS_OAUTH_SERVER_ENABLED:-false}';
  window['env']['oauthServerUrl'] = '${MIFOS_OAUTH_SERVER_URL:-}';
  window['env']['oauthAppId'] = '${MIFOS_OAUTH_CLIENT_ID:-}';
  window['env']['minPasswordLength'] = '${MIFOS_MIN_PASSWORD_LENGTH:-12}';
  window['env']['httpCacheEnabled'] = '${MIFOS_HTTP_CACHE_ENABLED:-false}';
})(this);
EOF

echo "Building Angular application..."
npm run build

echo "Build complete!"

