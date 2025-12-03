# BACKEND-PLACEHOLDER-START
"""
Placeholder normalizers for Fineract gateway pipeline.
No transformation logic; returns placeholder dictionaries.
"""


def normalize_client_response(raw):
    return {"normalized": True, "kind": "client", "raw": raw}


def normalize_accounts_response(raw):
    return {"normalized": True, "kind": "accounts", "raw": raw}


def normalize_loan_response(raw):
    return {"normalized": True, "kind": "loan", "raw": raw}


def normalize_schedule_response(raw):
    return {"normalized": True, "kind": "schedule", "raw": raw}


def normalize_transactions_response(raw):
    return {"normalized": True, "kind": "transactions", "raw": raw}
# BACKEND-PLACEHOLDER-END
