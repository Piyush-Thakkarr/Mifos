
"""
Client Data Views.
Exposes endpoints for client overview, details, and loan information.
"""

from django.http import JsonResponse
from .services import (
    get_client_overview,
    get_loan_overview,
    get_loan_schedule_only,
    get_loan_transactions_only,
    ServiceForbidden,
    get_clients_list,
    get_client_full_details,
    get_client_loans,
    get_client_identifiers_service,
    get_client_addresses_service,
    get_client_notes_service,
    get_loan_charges_service,
    get_loan_collateral_service,
)
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from client_portal_backend.auth_app.auth_checks import require_valid_session_or_401
from client_portal_backend.auth_app.ownership.ownership_enforcer import (
    enforce_client_ownership_or_403,
    enforce_loan_ownership_or_403,
)
from client_portal_backend.fineract_gateway.executor import GatewayError


def client_overview_view(request):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    client_id = get_logged_in_client_id(request)
    # Enforce ownership
    allowed, deny_response = enforce_client_ownership_or_403(request, client_id)
    if not allowed:
        return deny_response

    try:
        result = get_client_overview(request, client_id)
        details = (result or {}).get("details", {})
        accounts = (result or {}).get("accounts", [])
        payload = {
            "status": "ok",
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


def clients_list_view(request):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    try:
        items = get_clients_list(request)
        return JsonResponse({"clients": items})
    except GatewayError as e:
        code_map = {401: ("unauthenticated", 401), 403: ("forbidden", 403)}
        code, status = code_map.get(e.status, ("upstream_error" if e.status >= 500 else "invalid_request", 502 if e.status >= 500 else 400))
        return JsonResponse({
            "error": {"code": code, "message": "Upstream error" if status >= 500 else "Invalid request" if status == 400 else "Authentication required" if status == 401 else "Forbidden"},
            "correlationId": e.correlation_id,
        }, status=status)


def client_details_view(request, clientId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not clientId:
        clientId = get_logged_in_client_id(request)
    if not clientId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    try:
        result = get_client_full_details(request, str(clientId))
        return JsonResponse(result)
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


def client_loans_view(request, clientId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not clientId:
        clientId = get_logged_in_client_id(request)
    if not clientId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    try:
        loans = get_client_loans(request, str(clientId))
        return JsonResponse({"loans": loans})
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


def loan_overview_view(request, loan_id=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Enforce ownership
    allowed, deny_response = enforce_loan_ownership_or_403(request, loan_id)
    if not allowed:
        return deny_response
    try:
        result = get_loan_overview(request, loan_id)
        loan = (result or {}).get("loan", {})
        payload = {"status": "ok", **loan}
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


def loan_details_view(request, loanId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Enforce ownership
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_overview(request, loanId)
        loan = (result or {}).get("loan", {})
        payload = {"status": "ok", **loan}
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


def loan_schedule_view(request, loanId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Enforce ownership
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_schedule_only(request, loanId)
        schedule = (result or {}).get("schedule", {})
        payload = {"status": "ok", **schedule}
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


def loan_transactions_view(request, loanId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    # Enforce ownership
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        result = get_loan_transactions_only(request, loanId)
        txns = (result or {}).get("transactions", [])
        payload = {
            "status": "ok",
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


def client_identifiers_view(request, clientId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not clientId:
        clientId = get_logged_in_client_id(request)
    if not clientId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    try:
        data = get_client_identifiers_service(request, str(clientId))
        return JsonResponse(data, safe=False)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def client_address_view(request, clientId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not clientId:
        clientId = get_logged_in_client_id(request)
    if not clientId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    try:
        data = get_client_addresses_service(request, str(clientId))
        return JsonResponse(data, safe=False)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def client_notes_view(request, clientId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    if not clientId:
        clientId = get_logged_in_client_id(request)
    if not clientId:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    try:
        data = get_client_notes_service(request, str(clientId))
        return JsonResponse(data, safe=False)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def loan_charges_view(request, loanId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        data = get_loan_charges_service(request, str(loanId))
        return JsonResponse(data, safe=False)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def loan_collateral_view(request, loanId=None):
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    allowed, deny_response = enforce_loan_ownership_or_403(request, loanId)
    if not allowed:
        return deny_response
    try:
        data = get_loan_collateral_service(request, str(loanId))
        return JsonResponse(data, safe=False)
    except ServiceForbidden as e:
        return JsonResponse({"error": {"code": "forbidden", "message": "Access denied"}}, status=403)
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)
