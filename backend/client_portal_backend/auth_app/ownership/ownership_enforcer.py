# BACKEND-PLACEHOLDER-START
"""
Placeholder ownership enforcement handlers.
Return placeholder (allowed, response) tuples without real checks.
"""

from django.http import JsonResponse
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from .ownership_rules import (
    is_client_authorized_for_clientId,
    is_client_authorized_for_loan,
)


def _forbidden_response():
    return JsonResponse(
        {
            "error": {
                "code": "forbidden",
                "message": "Access denied (placeholder)",
            },
            "correlationId": "PLACEHOLDER_CID",
        },
        status=403,
    )


def enforce_client_ownership_or_403(request, requested_client_id):
    # BACKEND-PLACEHOLDER-START
    session_client_id = get_logged_in_client_id(request)
    if not is_client_authorized_for_clientId(session_client_id, requested_client_id):
        return False, _forbidden_response()
    return True, None
    # BACKEND-PLACEHOLDER-END


def enforce_loan_ownership_or_403(request, loan_id):
    # BACKEND-PLACEHOLDER-START
    session_client_id = get_logged_in_client_id(request)
    if not is_client_authorized_for_loan(session_client_id, loan_id):
        return False, _forbidden_response()
    return True, None
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
