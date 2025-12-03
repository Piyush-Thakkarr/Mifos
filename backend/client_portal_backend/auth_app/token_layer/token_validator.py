# BACKEND-PLACEHOLDER-START
"""
Placeholder token validator for Client Portal.
No real validation performed.
"""

import logging
from .token_generator import SESSION_PLACEHOLDER

logger = logging.getLogger("client_portal.auth")


def validate_session_token(token: str | None):
    # BACKEND-PLACEHOLDER-START
    # Consider a token "valid" only if a placeholder value is present
    return {"valid": bool(token), "placeholder": True, "token": token}
    # BACKEND-PLACEHOLDER-END


def validate_refresh_token(token: str | None):
    # BACKEND-PLACEHOLDER-START
    return {"valid": True, "placeholder": True, "token": token}
    # BACKEND-PLACEHOLDER-END


def validate_request_session(request):
    # BACKEND-PLACEHOLDER-START
    """
    Placeholder request-aware validator.
    - Reads cp_session cookie
    - If matches the placeholder token, attach a placeholder client id to the request
    - Returns a small result dict including validity and client id
    """
    # Resilient, case-insensitive cookie lookup
    token = None
    try:
        cookies = getattr(request, "COOKIES", {}) or {}
        if isinstance(cookies, dict):
            for k, v in cookies.items():
                if isinstance(k, str) and k.lower() == "cp_session":
                    token = v
                    break
    except Exception:
        token = None

    if token == SESSION_PLACEHOLDER:
        # Attach placeholder client id for downstream usage
        setattr(request, "_portal_client_id", "CL-0001")
        logger.debug("Auth success via cp_session placeholder; client_id=CL-0001")
        return {"valid": True, "placeholder": True, "clientId": "CL-0001"}

    if token is None:
        logger.debug("Auth failed: cp_session cookie missing")
    else:
        logger.debug("Auth failed: cp_session provided but invalid for placeholder")
    return {"valid": False, "placeholder": True}
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
