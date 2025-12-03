# BACKEND-PLACEHOLDER-START
"""
Placeholder token generator for Client Portal.
No crypto, no JWT, no secrets. Returns static placeholders.
"""


SESSION_PLACEHOLDER = "PLACEHOLDER_SESSION_TOKEN"
REFRESH_PLACEHOLDER = "PLACEHOLDER_REFRESH_TOKEN"


def generate_session_token(username: str | None, client_id: str | None):
    # BACKEND-PLACEHOLDER-START
    return SESSION_PLACEHOLDER
    # BACKEND-PLACEHOLDER-END


def generate_refresh_token(username: str | None):
    # BACKEND-PLACEHOLDER-START
    return REFRESH_PLACEHOLDER
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
