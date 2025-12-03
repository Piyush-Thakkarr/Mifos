"""
Savings Account Gateway.
Handles communication with Fineract savings account APIs.
"""

from typing import Dict, List, Any
from .executor import execute_json


def get_savings_accounts(client_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch savings accounts for a client."""
    raw, _cid = execute_json(path=f"/clients/{client_id}/accounts", headers_override=headers_override)
    savings = raw.get("savingsAccounts", []) if isinstance(raw, dict) else []
    return savings if isinstance(savings, list) else []


def get_savings_account_details(account_id: str, headers_override: Dict[str, str] | None = None) -> Dict[str, Any]:
    """Fetch savings account details."""
    raw, _cid = execute_json(path=f"/savingsaccounts/{account_id}", headers_override=headers_override)
    return raw if isinstance(raw, dict) else {}


def get_savings_transactions(account_id: str, headers_override: Dict[str, str] | None = None) -> List[Dict[str, Any]]:
    """Fetch savings account transactions."""
    raw, _cid = execute_json(path=f"/savingsaccounts/{account_id}/transactions", headers_override=headers_override)
    return raw if isinstance(raw, list) else []
