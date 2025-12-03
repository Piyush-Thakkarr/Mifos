# BACKEND-PLACEHOLDER-START
"""
Placeholder URL patterns for auth_app. No endpoints exposed.
"""
from typing import List
from django.urls import path
from .views import login_view, me_view

# Empty urlpatterns placeholder
urlpatterns: List = []

# BACKEND-PLACEHOLDER-START
urlpatterns += [
    # POST /auth/login (placeholder only)
    path("login", login_view, name="auth_login"),
    # GET /auth/me (placeholder only)
    path("me", me_view, name="auth_me"),
]
# BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
