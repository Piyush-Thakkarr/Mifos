"""
Auth URL Configuration.
"""
from typing import List
from django.urls import path
from .views import login_view, me_view, logout_view

urlpatterns: List = []


urlpatterns += [
    # POST /auth/login
    path("login", login_view, name="auth_login"),
    # GET /auth/me
    path("me", me_view, name="auth_me"),
    # POST /auth/logout
    path("logout", logout_view, name="auth_logout"),
]


