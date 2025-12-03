# BACKEND-PLACEHOLDER-START
"""
Placeholder utilities for reading session information.
No real validation or security checks.
"""


def get_logged_in_client_id(request):
    # BACKEND-PLACEHOLDER-START
    try:
        return getattr(request, "session", {}).get("client_id")
    except Exception:
        return None
    # BACKEND-PLACEHOLDER-END


def is_authenticated(request):
    # BACKEND-PLACEHOLDER-START
    return bool(get_logged_in_client_id(request))
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
