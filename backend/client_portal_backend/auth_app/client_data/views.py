# BACKEND-PLACEHOLDER-START
"""
Placeholder views to expose future client data endpoints.
These are concept-only; not wired in URLs by default.
"""

from django.http import JsonResponse
from .services import (
    get_client_overview,
    get_loan_overview,
    get_loan_schedule_only,
    get_loan_transactions_only,
    ServiceForbidden,
)
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from client_portal_backend.auth_app.auth_checks import require_valid_session_or_401
from client_portal_backend.auth_app.ownership.ownership_enforcer import (
    enforce_client_ownership_or_403,
    enforce_loan_ownership_or_403,
)
from client_portal_backend.fineract_gateway.executor import GatewayError


def client_overview_view(request):
    # BACKEND-PLACEHOLDER-START
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    client_id = get_logged_in_client_id(request)
    # Placeholder ownership enforcement (no real checks)
    allowed, deny_response = enforce_client_ownership_or_403(request, client_id)
    if not allowed:
        return deny_response
    # REVIEW NOTE: replaced placeholder JSON with sanitized service output (details + accounts)
    try:
        result = get_client_overview(request, client_id)
        details = (result or {}).get("details", {})
        accounts = (result or {}).get("accounts", [])
        payload = {
            "status": "placeholder",
            "clientId": details.get("clientId") or client_id or "",
            "displayName": details.get("displayName"),
            "externalId": details.get("externalId"),
            "officeName": details.get("officeName"),
            "mobileNo": details.get("mobileNo"),
            "accounts": accounts,
        }
        return JsonResponse(payload)
    except ServiceForbidden as e:
        return JsonResponse({
            "error": {"code": "forbidden", "message": "Access denied"},
            "correlationId": getattr(e, "correlation_id", "")
        }, status=403)
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)
    # BACKEND-PLACEHOLDER-END


def loan_overview_view(request, loan_id=None):
    # BACKEND-PLACEHOLDER-START
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Placeholder ownership enforcement (no real checks)
    allowed, deny_response = enforce_loan_ownership_or_403(request, loan_id)
    if not allowed:
        return deny_response
    try:
        result = get_loan_overview(request, loan_id)
        loan = (result or {}).get("loan", {})
        payload = {"status": "placeholder", **loan}
        return JsonResponse(payload)
    except ServiceForbidden as e:
        return JsonResponse({
            "error": {"code": "forbidden", "message": "Access denied"},
            "correlationId": getattr(e, "correlation_id", "")
        }, status=403)
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)
    # BACKEND-PLACEHOLDER-END


def loan_details_view(request, loanId=None):
    # BACKEND-PLACEHOLDER-START
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Placeholder ownership enforcement (no real checks)
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_overview(request, loanId)
        loan = (result or {}).get("loan", {})
        payload = {"status": "placeholder", **loan}
        return JsonResponse(payload)
    except ServiceForbidden as e:
        return JsonResponse({
            "error": {"code": "forbidden", "message": "Access denied"},
            "correlationId": getattr(e, "correlation_id", "")
        }, status=403)
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)
    # BACKEND-PLACEHOLDER-END


def loan_schedule_view(request, loanId=None):
    # BACKEND-PLACEHOLDER-START
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Placeholder ownership enforcement (no real checks)
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_schedule_only(request, loanId)
        schedule = (result or {}).get("schedule", {})
        payload = {"status": "placeholder", **schedule}
        return JsonResponse(payload)
    except ServiceForbidden as e:
        return JsonResponse({
            "error": {"code": "forbidden", "message": "Access denied"},
            "correlationId": getattr(e, "correlation_id", "")
        }, status=403)
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)
    # BACKEND-PLACEHOLDER-END


def loan_transactions_view(request, loanId=None):
    # BACKEND-PLACEHOLDER-START
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Placeholder ownership enforcement (no real checks)
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_transactions_only(request, loanId)
        txns = (result or {}).get("transactions", [])
        payload = {
            "status": "placeholder",
            "loanId": (result or {}).get("loan_id") or loanId or "",
            "transactions": txns,
        }
        return JsonResponse(payload)
    except ServiceForbidden as e:
        return JsonResponse({
            "error": {"code": "forbidden", "message": "Access denied"},
            "correlationId": getattr(e, "correlation_id", "")
        }, status=403)
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
