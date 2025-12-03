# BACKEND-PLACEHOLDER-START
"""
Placeholder URL patterns for client data endpoints.
No real logic; routes call placeholder views only.
"""

from typing import List
from django.urls import path
from .views import (
    client_overview_view,
    loan_details_view,
    loan_schedule_view,
    loan_transactions_view,
)

# Placeholder urlpatterns
urlpatterns: List = []

# BACKEND-PLACEHOLDER-START
urlpatterns += [
    path("overview", client_overview_view, name="client_data_overview"),
    path("loan/<loanId>/details", loan_details_view, name="client_data_loan_details"),
    path("loan/<loanId>/schedule", loan_schedule_view, name="client_data_loan_schedule"),
    path("loan/<loanId>/transactions", loan_transactions_view, name="client_data_loan_transactions"),
]
# BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
