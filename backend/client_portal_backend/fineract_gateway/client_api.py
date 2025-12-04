
"""
Client API Gateway.
Functions to fetch client details and accounts from Fineract.
"""

from typing import Any, Dict, List

from .executor import execute_json, GatewayError


def _norm_client_details(raw: Dict[str, Any]) -> Dict[str, Any]:

    return {
        "clientId": raw.get("id"),
        "displayName": raw.get("displayName"),
        "externalId": raw.get("externalId"),
        "officeName": raw.get("officeName"),
        "mobileNo": raw.get("mobileNo"),
    }



def _norm_accounts(raw: Dict[str, Any]) -> List[Dict[str, Any]]:

    accounts: List[Dict[str, Any]] = []
    loan_accounts = (raw or {}).get("loanAccounts", [])
    for la in loan_accounts:
        # Handle status object or value
        status_obj = la.get("status", {}) if isinstance(la.get("status"), dict) else {"code": la.get("status"), "value": la.get("status")}
        status_code = status_obj.get("code")
        status_value = status_obj.get("value")

        accounts.append(
            {
                "id": la.get("id"),
                "accountNo": la.get("accountNo"),
                "productName": (la.get("productName") or la.get("loanProductName")),
                "status": status_value, # Use human readable value if available
                "statusCode": status_code,
                # Principal logic: originalLoan -> approvedPrincipal -> principal
                "principal": la.get("originalLoan") or la.get("approvedPrincipal") or la.get("principal"),
                "principalOutstanding": la.get("loanBalance") or la.get("principalOutstanding"),
                "nextDueDate": None,  # Not all endpoints provide this; view layer may enrich later
            }
        )
    return accounts



def get_client_details(client_id: str, headers_override: Dict[str, str] | None = None) -> Dict[str, Any]:

    raw, _cid = execute_json(path=f"/clients/{client_id}", headers_override=headers_override)
    return _norm_client_details(raw)



def get_client_accounts(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:

    raw, _cid = execute_json(path=f"/clients/{client_id}/accounts", headers_override=headers_override)
    return _norm_accounts(raw)



def list_clients(limit: int = 50, offset: int = 0, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Return a list of clients, normalized to minimal shape."""
    raw, _cid = execute_json(path="/clients", query={"limit": limit, "offset": offset}, headers_override=headers_override)
    data = raw if isinstance(raw, dict) else {}
    page = data.get("pageItems") or data.get("clients") or []
    out: List[Dict[str, Any]] = []
    for c in page:
        out.append(_norm_client_details(c))
    return out


def list_client_loans(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Return loan accounts for a client via /clients/{id}/accounts."""
    accounts = get_client_accounts(client_id, headers_override=headers_override)
    # Already normalized; filter loans by presence of productName/status fields
    return accounts


def get_client_identifiers(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch client identifiers."""
    raw, _cid = execute_json(path=f"/clients/{client_id}/identifiers", headers_override=headers_override)
    return raw if isinstance(raw, list) else []


def get_client_addresses(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch client addresses."""
    # Fineract address API is often /clients/{id}/addresses or via query param.
    # Standard Fineract usually requires a separate module or specific config.
    # We will try the standard endpoint.
    try:
        raw, _cid = execute_json(path=f"/clients/{client_id}/addresses", headers_override=headers_override)
        return raw if isinstance(raw, list) else []
    except GatewayError:
        # Fallback or empty if module not enabled
        return []


def get_client_notes(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch client notes."""
    raw, _cid = execute_json(path=f"/clients/{client_id}/notes", headers_override=headers_override)
    return raw if isinstance(raw, list) else []

