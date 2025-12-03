"""
Savings Services.
Business logic for savings account operations.
"""

from typing import Dict, List, Any
from client_portal_backend.fineract_gateway.savings_api import (
    get_savings_accounts,
    get_savings_account_details,
    get_savings_transactions,
)
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id


class ServiceForbidden(Exception):
    def __init__(self, message: str, correlation_id: str):
        self.message = message
        self.correlation_id = correlation_id
        super().__init__(message)


def get_auth_headers_from_request(request) -> Dict[str, str] | None:
    """Extract auth headers from request."""
    auth_header = getattr(request, "_basic_auth_header", None)
    return {"Authorization": auth_header} if auth_header else None


def get_savings_list_service(request) -> List[Dict[str, Any]]:
    """Get savings accounts for logged-in client."""
    client_id = get_logged_in_client_id(request)
    if not client_id:
        return []
    headers = get_auth_headers_from_request(request)
    return get_savings_accounts(client_id, headers_override=headers)


def get_savings_details_service(request, account_id: str) -> Dict[str, Any]:
    """Get savings account details with ownership check."""
    headers = get_auth_headers_from_request(request)
    details = get_savings_account_details(account_id, headers_override=headers)
    # Basic ownership check
    session_client = get_logged_in_client_id(request)
    if details.get("clientId") and session_client and str(details.get("clientId")) != str(session_client):
        from client_portal_backend.fineract_gateway.utils import gen_correlation_id
        raise ServiceForbidden("Savings account ownership mismatch", gen_correlation_id())
    return details


def get_savings_transactions_service(request, account_id: str) -> List[Dict[str, Any]]:
    """Get savings transactions with ownership check."""
    # First verify ownership
    _ = get_savings_details_service(request, account_id)
    headers = get_auth_headers_from_request(request)
    return get_savings_transactions(account_id, headers_override=headers)
