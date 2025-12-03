
"""
Auth validator that treats cp_session as a passthrough Basic credential.
Cookie value may be either:
- "Basic <base64(username:password)>" or
- "<base64(username:password)>"
This module never stores secrets; it only reconstructs Authorization header per request.
"""

import logging
import base64

logger = logging.getLogger("client_portal.auth")


def validate_session_token(token: str | None):

    # Consider a token "valid" only if a placeholder value is present
    return {"valid": bool(token), "placeholder": True, "token": token}



def validate_refresh_token(token: str | None):

    return {"valid": True, "placeholder": True, "token": token}



def validate_request_session(request):
    # Resilient, case-insensitive cookie lookup
    raw = None
    try:
        cookies = getattr(request, "COOKIES", {}) or {}
        if isinstance(cookies, dict):
            for k, v in cookies.items():
                if isinstance(k, str) and k.lower() == "cp_session":
                    raw = v
                    break
    except Exception:
        raw = None

    if not raw:
        logger.debug("Auth failed: cp_session cookie missing")
        return {"valid": False}

    try:
        parts = str(raw).strip().split()
        if len(parts) == 2 and parts[0].lower() == "basic":
            b64 = parts[1]
        else:
            b64 = parts[0]
        decoded = base64.b64decode(b64).decode("utf-8", errors="ignore")
        if ":" not in decoded:
            raise ValueError("invalid basic payload")
        username, _password = decoded.split(":", 1)
        auth_header = f"Basic {b64}"
        # Attach for downstream use in gateway calls
        setattr(request, "_basic_auth_header", auth_header)
        setattr(request, "_auth_username", username)
        logger.debug("Auth success via cp_session passthrough; user=%s", username)
        return {"valid": True, "username": username}
    except Exception:
        logger.debug("Auth failed: cp_session present but invalid")
        return {"valid": False}


def get_auth_headers_from_request(request):
    """Return headers dict with Authorization from request, if present."""
    try:
        hdr = getattr(request, "_basic_auth_header", None)
        if hdr:
            return {"Authorization": hdr}
        # Fallback: try to reconstruct from cookie on demand
        res = validate_request_session(request)
        if res.get("valid") and getattr(request, "_basic_auth_header", None):
            return {"Authorization": getattr(request, "_basic_auth_header")}
    except Exception:
        pass
    return {}

