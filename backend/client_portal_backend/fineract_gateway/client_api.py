# BACKEND-PLACEHOLDER-START
"""
REVIEW NOTE: Updated to call Fineract admin APIs using env-driven config and executor.
No secrets are committed. Paths assume FINERACT_BASE_URL already contains the API
prefix (e.g., https://host/fineract-provider/api/v1). Only minimal fields are returned.
"""

from typing import Any, Dict, List

from .executor import execute_json, GatewayError


def _norm_client_details(raw: Dict[str, Any]) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    return {
        "clientId": raw.get("id"),
        "displayName": raw.get("displayName"),
        "externalId": raw.get("externalId"),
        "officeName": raw.get("officeName"),
        "mobileNo": raw.get("mobileNo"),
    }
    # BACKEND-PLACEHOLDER-END


def _norm_accounts(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    # BACKEND-PLACEHOLDER-START
    accounts: List[Dict[str, Any]] = []
    loan_accounts = (raw or {}).get("loanAccounts", [])
    for la in loan_accounts:
        accounts.append(
            {
                "id": la.get("id"),
                "accountNo": la.get("accountNo"),
                "productName": (la.get("productName") or la.get("loanProductName")),
                "status": (la.get("status", {}) or {}).get("code") or la.get("status"),
                "principal": la.get("principal") or la.get("originalLoan"),
                "principalOutstanding": la.get("principalOutstanding"),
                "nextDueDate": None,  # Not all endpoints provide this; view layer may enrich later
            }
        )
    return accounts
    # BACKEND-PLACEHOLDER-END


def get_client_details(client_id: str) -> Dict[str, Any]:
    # BACKEND-PLACEHOLDER-START
    raw, _cid = execute_json(path=f"/clients/{client_id}")
    return _norm_client_details(raw)
    # BACKEND-PLACEHOLDER-END


def get_client_accounts(client_id: str) -> List[Dict[str, Any]]:
    # BACKEND-PLACEHOLDER-START
    raw, _cid = execute_json(path=f"/clients/{client_id}/accounts")
    return _norm_accounts(raw)
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
