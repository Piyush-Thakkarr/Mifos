"""
Savings URL Configuration.
"""

from typing import List
from django.urls import path
from .views import (
    savings_list_view,
    savings_details_view,
    savings_transactions_view,
)

urlpatterns: List = [
    path("savings", savings_list_view, name="savings_list"),
    path("savings/", savings_list_view, name="savings_list"),
    path("savings/<accountId>", savings_details_view, name="savings_details"),
    path("savings/<accountId>/", savings_details_view, name="savings_details"),
    path("savings/<accountId>/transactions", savings_transactions_view, name="savings_transactions"),
    path("savings/<accountId>/transactions/", savings_transactions_view, name="savings_transactions"),
]
