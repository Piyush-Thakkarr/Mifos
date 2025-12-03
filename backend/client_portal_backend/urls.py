# BACKEND-PLACEHOLDER-START
"""
Minimal URL config placeholder for client_portal_backend.
No routes are exposed yet.
"""

from typing import List
from django.urls import include, path

# Placeholder urlpatterns (empty)
urlpatterns: List = []

# BACKEND-PLACEHOLDER-START
urlpatterns += [
    path("auth/", include("client_portal_backend.auth_app.urls")),
    path("client-data/", include("client_portal_backend.auth_app.client_data.urls")),
]
# BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
