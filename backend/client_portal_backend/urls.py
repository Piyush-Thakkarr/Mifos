"""
URL Configuration for client_portal_backend.
"""

from typing import List
from django.urls import include, path

urlpatterns: List = []


urlpatterns += [
    path("auth/", include("client_portal_backend.auth_app.urls")),
    # Map top-level endpoints to client_data urls
    path("", include("client_portal_backend.auth_app.client_data.urls")),
    path("", include("client_portal_backend.auth_app.savings.urls")),
    path("", include("client_portal_backend.auth_app.dashboard.urls")),
]


