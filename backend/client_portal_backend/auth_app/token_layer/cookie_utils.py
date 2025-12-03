# BACKEND-PLACEHOLDER-START
"""
Placeholder cookie helpers for Client Portal auth.
No security flags set; purely placeholder behavior.
"""

from .token_generator import SESSION_PLACEHOLDER, REFRESH_PLACEHOLDER

def set_auth_cookies(response, session_token: str | None, refresh_token: str | None):
    # BACKEND-PLACEHOLDER-START
    try:
        response.set_cookie(
            "cp_session",
            session_token or SESSION_PLACEHOLDER,
            path="/",
            samesite="Lax",
            secure=False,
        )
        response.set_cookie(
            "cp_refresh",
            refresh_token or REFRESH_PLACEHOLDER,
            path="/",
            samesite="Lax",
            secure=False,
        )
    except Exception:
        pass
    return response
    # BACKEND-PLACEHOLDER-END


def clear_auth_cookies(response):
    # BACKEND-PLACEHOLDER-START
    try:
        response.delete_cookie("cp_session", path="/")
        response.delete_cookie("cp_refresh", path="/")
    except Exception:
        pass
    return response
    # BACKEND-PLACEHOLDER-END


def extract_tokens_from_request(request):
    # BACKEND-PLACEHOLDER-START
    try:
        cookies = getattr(request, "COOKIES", {})
        return cookies.get("cp_session"), cookies.get("cp_refresh")
    except Exception:
        return None, None
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
