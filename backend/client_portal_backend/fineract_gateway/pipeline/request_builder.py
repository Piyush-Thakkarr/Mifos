# BACKEND-PLACEHOLDER-START
"""
Placeholder request builders for Fineract gateway pipeline.
Each builder returns a simple placeholder dict; no real HTTP params.
"""


def build_client_details_request(client_id):
    return {"type": "client_details", "client_id": client_id, "placeholder": True}


def build_accounts_request(client_id):
    return {"type": "client_accounts", "client_id": client_id, "placeholder": True}


def build_loan_details_request(loan_id):
    return {"type": "loan_details", "loan_id": loan_id, "placeholder": True}


def build_loan_transactions_request(loan_id):
    return {"type": "loan_transactions", "loan_id": loan_id, "placeholder": True}


def build_repayment_schedule_request(loan_id):
    return {"type": "repayment_schedule", "loan_id": loan_id, "placeholder": True}
# BACKEND-PLACEHOLDER-END
