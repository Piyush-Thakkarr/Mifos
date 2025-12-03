# BACKEND-PLACEHOLDER-START
"""
Placeholder refresh handler for Client Portal.
No real security or token rotation logic.
"""

from .token_generator import generate_session_token
from .cookie_utils import extract_tokens_from_request


def refresh_session(request):
    # BACKEND-PLACEHOLDER-START
    _session_token, refresh_token = extract_tokens_from_request(request)
    # Ignore the refresh_token value; return a static placeholder
    new_session = generate_session_token("placeholder_user", "PLACEHOLDER_CLIENT_ID")
    return {"status": "placeholder", "session_token": new_session, "refresh_used": bool(refresh_token)}
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
