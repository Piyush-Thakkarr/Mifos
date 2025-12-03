# BACKEND-PLACEHOLDER-START
"""
Placeholder views module for auth_app. No real endpoints.
"""
from django.http import JsonResponse
from client_portal_backend.fineract_gateway.client_api import get_client_details
from client_portal_backend.auth_app.token_layer import token_generator
from client_portal_backend.auth_app.token_layer import cookie_utils
from client_portal_backend.auth_app.token_layer.token_validator import validate_request_session


def login_view(request):
    # BACKEND-PLACEHOLDER-START
    username = request.POST.get("username")
    password = request.POST.get("password")

    if not username or not password:
        try:
            import json  # standard library only

            data = json.loads(request.body or b"{}")
            username = username or data.get("username")
            password = password or data.get("password")
        except Exception:
            pass

    # Reviewer note: TEST-CREDENTIAL: username=client password=password — maps to client_id CL-0001 — placeholder only.
    if username == "client" and password == "password":
        client_id = "CL-0001"
        if hasattr(request, "session"):
            try:
                request.session["auth_user"] = username
                request.session["client_id"] = client_id
            except Exception:
                # Session may not be configured; ignore in placeholder
                pass
        # Generate placeholder tokens and set placeholder cookies (no real security)
        session_token = token_generator.generate_session_token(username, client_id)
        refresh_token = token_generator.generate_refresh_token(username)
        response = JsonResponse({
            "status": "ok",
            "message": "placeholder login successful",
            "clientId": client_id,
        })
        response = cookie_utils.set_auth_cookies(response, session_token, refresh_token)
        return response

    return JsonResponse(
        {
            "status": "placeholder",
            "message": "Invalid credentials placeholder",
        },
        status=400,
    )
    # BACKEND-PLACEHOLDER-END


def me_view(request):
    # BACKEND-PLACEHOLDER-START
    # Use cp_session as source of truth via request-aware validation
    result = validate_request_session(request)
    if result.get("valid"):
        client_id = getattr(request, "_portal_client_id", None) or result.get("clientId")
        return JsonResponse({"status": "ok", "client_id": client_id})

    # Invalid cp_session → return sanitized unauthenticated envelope (matches client-data views)
    return JsonResponse(
        {
            "error": {
                "code": "unauthenticated",
                "message": "Authentication required (placeholder)",
            },
            "correlationId": "PLACEHOLDER_CID",
        },
        status=401,
    )
    # BACKEND-PLACEHOLDER-END
# BACKEND-PLACEHOLDER-END
