# BACKEND-PLACEHOLDER-START
"""
REVIEW NOTE: Updated to call the real Fineract gateway functions and enforce
server-side ownership (clientId) before returning data. Only minimal fields are
returned as required by the client portal views. Errors are raised as exceptions
for the view layer to sanitize into JSON envelopes.
"""

from client_portal_backend.fineract_gateway.client_api import (
    get_client_details,
    get_client_accounts,
)
from client_portal_backend.fineract_gateway.loan_api import (
    get_loan_details,
    get_loan_transactions,
    get_repayment_schedule,
)
from client_portal_backend.auth_app.utils.session_access import get_logged_in_client_id
from client_portal_backend.fineract_gateway.utils import gen_correlation_id


class ServiceForbidden(Exception):
    # BACKEND-PLACEHOLDER-START
    def __init__(self, message: str, correlation_id: str):
        super().__init__(message)
        self.correlation_id = correlation_id
    # BACKEND-PLACEHOLDER-END

def get_client_overview(request, client_id: str | None) -> dict:
    """Placeholder to combine basic client info and accounts.
    Calls placeholder gateway functions only; no real HTTP.
    """
    # BACKEND-PLACEHOLDER-START
    # TODO: final implementation will enforce ownership using real Fineract client/loan data
    session_client = get_logged_in_client_id(request)
    details = get_client_details(client_id)  # normalized dict
    if details.get("clientId") and session_client and details.get("clientId") != session_client:
        raise ServiceForbidden("Client ownership mismatch", gen_correlation_id())
    accounts = get_client_accounts(client_id)  # list of normalized accounts
    return {
        "placeholder": True,
        "client_id": client_id,
        "details": details,
        "accounts": accounts,
    }


def get_loan_overview(request, loan_id: str | None) -> dict:
    """Placeholder to combine loan details, schedule, and transactions.
    Calls placeholder gateway functions only; no real HTTP.
    """
    # BACKEND-PLACEHOLDER-START
    # TODO: final implementation will enforce ownership using real Fineract client/loan data
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(loan_id)  # normalized dict
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    schedule = get_repayment_schedule(loan_id)  # normalized schedule dict
    txns = get_loan_transactions(loan_id)  # normalized list
    return {
        "placeholder": True,
        "loan_id": loan_id,
        "loan": loan,
        "schedule": schedule,
        "transactions": txns,
    }


def get_loan_schedule_only(request, loan_id: str | None) -> dict:
    # BACKEND-PLACEHOLDER-START
    """Placeholder to retrieve only the repayment schedule."""
    # Enforce ownership using loan details
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(loan_id)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    schedule = get_repayment_schedule(loan_id)
    return {"placeholder": True, "loan_id": loan_id, "schedule": schedule}
    # BACKEND-PLACEHOLDER-END


def get_loan_transactions_only(request, loan_id: str | None) -> dict:
    # BACKEND-PLACEHOLDER-START
    """Placeholder to retrieve only the transactions list."""
    # Enforce ownership using loan details
    session_client = get_logged_in_client_id(request)
    loan = get_loan_details(loan_id)
    if loan.get("clientId") and session_client and loan.get("clientId") != session_client:
        raise ServiceForbidden("Loan ownership mismatch", gen_correlation_id())
    txns = get_loan_transactions(loan_id)
    return {"placeholder": True, "loan_id": loan_id, "transactions": txns}
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
