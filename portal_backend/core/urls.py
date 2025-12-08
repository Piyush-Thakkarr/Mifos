from django.urls import path

from .views import (
    login_view,
    dashboard_view,
    me_view,
    client_view,
    loans_view,
    savings_view,
    transactions_view,
    loan_details_view,
    download_loan_statement,
    download_repayment_schedule,
    download_transactions_statement,
    notifications_view,
    mark_notification_read_view,
    mark_all_notifications_read_view,
    delete_notification_view,
)

urlpatterns = [
    path("auth/login", login_view, name="clientportal-login"),
    path("auth/me", me_view, name="clientportal-me"),
    path("dashboard", dashboard_view, name="clientportal-dashboard"),
    path("clientportal/client", client_view, name="clientportal-client"),
    path("clientportal/loans", loans_view, name="clientportal-loans"),
    path("clientportal/loans/<int:loan_id>", loan_details_view, name="clientportal-loan-details"),
    path("clientportal/loans/<int:loan_id>/statement", download_loan_statement, name="clientportal-loan-statement"),
    path("clientportal/loans/<int:loan_id>/schedule", download_repayment_schedule, name="clientportal-loan-schedule"),
    path("clientportal/savings", savings_view, name="clientportal-savings"),
    path("clientportal/transactions", transactions_view, name="clientportal-transactions"),
    path("clientportal/transactions/download", download_transactions_statement, name="clientportal-transactions-download"),
    path("clientportal/notifications", notifications_view, name="clientportal-notifications"),
    path("clientportal/notifications/<int:notification_id>/read", mark_notification_read_view, name="clientportal-notification-read"),
    path("clientportal/notifications/read-all", mark_all_notifications_read_view, name="clientportal-notifications-read-all"),
    path("clientportal/notifications/<int:notification_id>", delete_notification_view, name="clientportal-notification-delete"),
]
