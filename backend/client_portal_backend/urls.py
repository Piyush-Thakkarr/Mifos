"""
Minimal URL config for client_portal_backend.
Auth, client-data, and a /healthz endpoint for Render health checks.
"""

from typing import List
from django.urls import include, path
from django.http import JsonResponse

urlpatterns: List = []


urlpatterns += [
    # Health check
    path("healthz", lambda request: JsonResponse({"status": "ok"})),
    path("", lambda request: JsonResponse({"status": "ok", "message": "Mifos Backend is Running"})),
    # Auth and client-data APIs
    path("auth/", include("client_portal_backend.auth_app.urls")),
    path("client-data/", include("client_portal_backend.auth_app.client_data.urls")),
    # Savings and dashboard APIs
    path("", include("client_portal_backend.auth_app.savings.urls")),
    path("", include("client_portal_backend.auth_app.dashboard.urls")),
    # API aliases expected by the frontend (e.g., /api/clients, /api/loans)
    path("api/", include("client_portal_backend.auth_app.client_data.urls")),
    path("api/", include("client_portal_backend.auth_app.savings.urls")),
    path("api/", include("client_portal_backend.auth_app.dashboard.urls")),
]
