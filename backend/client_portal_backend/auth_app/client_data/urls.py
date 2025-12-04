"""
Client Data URL Configuration.
Maps endpoints for Client, Loans, and related resources.
"""

from typing import List
from django.urls import path
from .views import (
    client_details_view,
    client_identifiers_view,
    client_address_view,
    client_notes_view,
    client_loans_view,
    loan_details_view,
    loan_schedule_view,
    loan_transactions_view,
    loan_charges_view,
    loan_collateral_view,
)

urlpatterns: List = [
    # Client Endpoints
    path("client", client_details_view, name="client_details"),
    path("client/", client_details_view, name="client_details"),
    path("client/<str:clientId>", client_details_view, name="client_details_id"),
    path("client/<str:clientId>/", client_details_view, name="client_details_id"),
    
    path("client/identifiers", client_identifiers_view, name="client_identifiers"),
    path("client/identifiers/", client_identifiers_view, name="client_identifiers"),
    path("client/<str:clientId>/identifiers", client_identifiers_view, name="client_identifiers_id"),
    path("client/<str:clientId>/identifiers/", client_identifiers_view, name="client_identifiers_id"),

    path("client/address", client_address_view, name="client_address"),
    path("client/address/", client_address_view, name="client_address"),
    path("client/<str:clientId>/address", client_address_view, name="client_address_id"),
    path("client/<str:clientId>/address/", client_address_view, name="client_address_id"),

    path("client/notes", client_notes_view, name="client_notes"),
    path("client/notes/", client_notes_view, name="client_notes"),
    path("client/<str:clientId>/notes", client_notes_view, name="client_notes_id"),
    path("client/<str:clientId>/notes/", client_notes_view, name="client_notes_id"),

    # Loan Endpoints
    path("loans", client_loans_view, name="client_loans"),
    path("loans/", client_loans_view, name="client_loans"),
    path("loans/<loanId>", loan_details_view, name="loan_details"),
    path("loans/<loanId>/", loan_details_view, name="loan_details"),
    path("loans/<loanId>/repayments", loan_schedule_view, name="loan_repayments"),
    path("loans/<loanId>/repayments/", loan_schedule_view, name="loan_repayments"),
    path("loans/<loanId>/transactions", loan_transactions_view, name="loan_transactions"),
    path("loans/<loanId>/transactions/", loan_transactions_view, name="loan_transactions"),
    path("loans/<loanId>/charges", loan_charges_view, name="loan_charges"),
    path("loans/<loanId>/charges/", loan_charges_view, name="loan_charges"),
    path("loans/<loanId>/collateral", loan_collateral_view, name="loan_collateral"),
    path("loans/<loanId>/collateral/", loan_collateral_view, name="loan_collateral"),
]
