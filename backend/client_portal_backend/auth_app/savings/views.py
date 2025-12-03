"""
Savings Views.
Endpoints for savings account operations.
"""

from django.http import JsonResponse
from .services import (
    get_savings_list_service,
    get_savings_details_service,
    get_savings_transactions_service,
    ServiceForbidden,
)
from client_portal_backend.auth_app.auth_checks import require_valid_session_or_401
from client_portal_backend.fineract_gateway.executor import GatewayError


def savings_list_view(request):
    """GET /savings - List savings accounts."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    try:
        accounts = get_savings_list_service(request)
        return JsonResponse({"savings": accounts})
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def savings_details_view(request, accountId=None):
    """GET /savings/{id} - Savings account details."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not accountId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Account ID required"}}, status=400)
    try:
        details = get_savings_details_service(request, str(accountId))
        return JsonResponse(details)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def savings_transactions_view(request, accountId=None):
    """GET /savings/{id}/transactions - Savings transactions."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not accountId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Account ID required"}}, status=400)
    try:
        transactions = get_savings_transactions_service(request, str(accountId))
        return JsonResponse({"transactions": transactions})
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)
