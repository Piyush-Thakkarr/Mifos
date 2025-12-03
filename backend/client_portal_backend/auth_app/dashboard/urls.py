"""
Dashboard URL Configuration.
"""

from typing import List
from django.urls import path
from .views import (
    dashboard_view,
    notifications_view,
    loan_application_view,
    loan_application_status_view,
    kyc_upload_view,
)

urlpatterns: List = [
    path("dashboard", dashboard_view, name="dashboard"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("notifications", notifications_view, name="notifications"),
    path("notifications/", notifications_view, name="notifications"),
    path("loan-application", loan_application_view, name="loan_application"),
    path("loan-application/", loan_application_view, name="loan_application"),
    path("loan-application/status", loan_application_status_view, name="loan_application_status"),
    path("loan-application/status/", loan_application_status_view, name="loan_application_status"),
    path("client/kyc/upload", kyc_upload_view, name="kyc_upload"),
    path("client/kyc/upload/", kyc_upload_view, name="kyc_upload"),
]
