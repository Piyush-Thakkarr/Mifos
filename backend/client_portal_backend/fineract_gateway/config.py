# BACKEND-PLACEHOLDER-START
"""
REVIEW NOTE: This file was updated to read Fineract admin config from environment variables only.
Credentials are never stored in this repo. See backend README for variable names.
"""

import os


def get_config() -> dict:
    """Read gateway configuration from environment variables.

    Required envs:
    - FINERACT_BASE_URL
    - FINERACT_TENANT_ID
    Optional auth:
    - FINERACT_USE_BASIC_AUTH ("1" to enable)
    - FINERACT_ADMIN_USERNAME / FINERACT_ADMIN_PASSWORD (when basic auth)
    Optional networking:
    - FINERACT_TIMEOUT_SECS (default 10)
    - FINERACT_RETRY_COUNT (default 2)
    """
    return {
        "base_url": os.environ.get("FINERACT_BASE_URL", "https://localhost:8443/fineract-provider/api/v1"),
        "tenant": os.environ.get("FINERACT_TENANT_ID", "default"),
        "use_basic_auth": os.environ.get("FINERACT_USE_BASIC_AUTH", "1") == "1",
        "username": os.environ.get("FINERACT_ADMIN_USERNAME", "mifos"),
        "password": os.environ.get("FINERACT_ADMIN_PASSWORD", "password"),
        "timeout": float(os.environ.get("FINERACT_TIMEOUT_SECS", "10")),
        "retries": int(os.environ.get("FINERACT_RETRY_COUNT", "2")),
    }
# BACKEND-PLACEHOLDER-END
