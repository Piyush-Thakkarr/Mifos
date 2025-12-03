
"""
Client Data Services.
Orchestrates data fetching from Fineract and enforces ownership checks.
"""

from client_portal_backend.fineract_gateway.client_api import (
    get_client_details,
    get_client_accounts,
    list_clients,
    list_client_loans,
    get_client_identifiers,
    get_client_addresses,
    get_client_notes,
)
from client_portal_backend.fineract_gateway.loan_api import (
    get_loan_details,
    get_loan_transactions,
    get_repayment_schedule,
    get_loan_charges,
    get_loan_collateral,
)
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from client_portal_backend.fineract_gateway.utils import gen_correlation_id
from client_portal_backend.auth_app.token_layer.token_validator import get_auth_headers_from_request


class ServiceForbidden(Exception):

    def __init__(self, message: str, correlation_id: str):
        super().__init__(message)
        self.correlation_id = correlation_id


def get_client_overview(request, client_id: str | None) -> dict:
    """Combine basic client info and accounts using real gateway calls."""
    headers = get_auth_headers_from_request(request)
    session_client = get_logged_in_client_id(request)
    details = get_client_details(str(client_id), headers_override=headers)  # normalized dict
    if details.get("clientId") and session_client and details.get("clientId") != session_client:
        raise ServiceForbidden("Client ownership mismatch", gen_correlation_id())
    accounts = get_client_accounts(str(client_id), headers_override=headers)  # list of normalized accounts
    return {
        "client_id": client_id,
        "details": details,
        "accounts": accounts,
    }


def get_loan_overview(request, loan_id: str | None) -> dict:
    """Combine loan details, schedule, and transactions via real gateway calls."""
    headers = get_auth_headers_from_request(request)
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(str(loan_id), headers_override=headers)  # normalized dict
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    schedule = get_repayment_schedule(str(loan_id), headers_override=headers)  # normalized schedule dict
    txns = get_loan_transactions(str(loan_id), headers_override=headers)  # normalized list
    return {
        "loan_id": loan_id,
        "loan": loan,
        "schedule": schedule,
        "transactions": txns,
    }


def get_loan_schedule_only(request, loan_id: str | None) -> dict:
    """Retrieve only the repayment schedule."""
    headers = get_auth_headers_from_request(request)
    # Enforce ownership using loan details
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(str(loan_id), headers_override=headers)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    schedule = get_repayment_schedule(str(loan_id), headers_override=headers)
    return {"loan_id": loan_id, "schedule": schedule}


def get_loan_transactions_only(request, loan_id: str | None) -> dict:
    """Retrieve only the transactions list."""
    headers = get_auth_headers_from_request(request)
    # Enforce ownership using loan details
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(str(loan_id), headers_override=headers)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    txns = get_loan_transactions(str(loan_id), headers_override=headers)
    return {"loan_id": loan_id, "transactions": txns}


def get_clients_list(request, limit: int = 50, offset: int = 0) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    return list_clients(limit=limit, offset=offset, headers_override=headers)


def get_client_full_details(request, client_id: str) -> dict:
    headers = get_auth_headers_from_request(request)
    session_client = get_logged_in_client_id(request)
    details = get_client_details(client_id, headers_override=headers)
    if details.get("clientId") and session_client and details.get("clientId") != session_client:
        raise ServiceForbidden("Client ownership mismatch", gen_correlation_id())
    accounts = get_client_accounts(client_id, headers_override=headers)
    return {"details": details, "accounts": accounts}


def get_client_loans(request, client_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check via details
    _ = get_client_full_details(request, client_id)
    return list_client_loans(client_id, headers_override=headers)


def get_client_identifiers_service(request, client_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check
    _ = get_client_full_details(request, client_id)
    return get_client_identifiers(client_id, headers_override=headers)


def get_client_addresses_service(request, client_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check
    _ = get_client_full_details(request, client_id)
    return get_client_addresses(client_id, headers_override=headers)


def get_client_notes_service(request, client_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check
    _ = get_client_full_details(request, client_id)
    return get_client_notes(client_id, headers_override=headers)


def get_loan_charges_service(request, loan_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(str(loan_id), headers_override=headers)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    return get_loan_charges(loan_id, headers_override=headers)


def get_loan_collateral_service(request, loan_id: str) -> list[dict]:
    headers = get_auth_headers_from_request(request)
    # Ownership check
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(str(loan_id), headers_override=headers)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    return get_loan_collateral(loan_id, headers_override=headers)
