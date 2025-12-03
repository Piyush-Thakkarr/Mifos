# BACKEND-PLACEHOLDER-START
"""
Placeholder centralized auth checks for client_data views.
No real validation; returns placeholder 401 on invalid token.
"""

from django.http import JsonResponse
from client_portal_backend.auth_app.token_layer.cookie_utils import extract_tokens_from_request
from client_portal_backend.auth_app.token_layer.token_validator import validate_request_session


def require_valid_session_or_401(request):
    # BACKEND-PLACEHOLDER-START
    # Use request-aware token validation so cp_session is the source of truth
    result = validate_request_session(request)
    if not (result and result.get("valid")):
        return False, JsonResponse(
            {
                "error": {
                    "code": "unauthenticated",
                    "message": "Authentication required (placeholder)",
                },
                "correlationId": "PLACEHOLDER_CID",
            },
            status=401,
        )
    return True, None
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
