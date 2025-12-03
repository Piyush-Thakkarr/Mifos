"""
Dashboard and Placeholder Views.
Includes dashboard, notifications, and KYC endpoints.
"""

from django.http import JsonResponse
from client_portal_backend.auth_app.auth_checks import require_valid_session_or_401
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from client_portal_backend.auth_app.client_data.services import get_client_full_details, get_client_loans
from client_portal_backend.auth_app.savings.services import get_savings_list_service
from client_portal_backend.fineract_gateway.executor import GatewayError


def dashboard_view(request):
    """GET /dashboard - Aggregate dashboard data."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    
    client_id = get_logged_in_client_id(request)
    if not client_id:
        return JsonResponse({"error": {"code": "invalid_request", "message": "Client ID required"}}, status=400)
    
    try:
        # Fetch client details
        client = get_client_full_details(request, client_id)
        # Fetch loans
        loans = get_client_loans(request, client_id)
        # Fetch savings
        savings = get_savings_list_service(request)
        
        return JsonResponse({
            "status": "ok",
            "client": client,
            "loans": loans,
            "savings": savings,
        })
    except GatewayError as e:
        return JsonResponse({"error": {"code": "upstream_error", "message": "Upstream error"}, "correlationId": e.correlation_id}, status=502)


def notifications_view(request):
    """GET /notifications - Placeholder for notifications."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    
    # Placeholder: return empty list
    return JsonResponse({"notifications": []})


def loan_application_view(request):
    """POST /loan-application - Placeholder for loan application."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    
    # Placeholder: return success
    return JsonResponse({"status": "ok", "message": "Loan application submitted (placeholder)"})


def loan_application_status_view(request):
    """GET /loan-application/status - Placeholder for loan application status."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    
    # Placeholder: return pending status
    return JsonResponse({"status": "pending", "message": "No active applications"})


def kyc_upload_view(request):
    """POST /client/kyc/upload - Placeholder for KYC upload."""
    is_valid, error_response = require_valid_session_or_401(request)
    if not is_valid:
        return error_response
    
    # Placeholder: return success
    return JsonResponse({"status": "ok", "message": "KYC document uploaded (placeholder)"})
