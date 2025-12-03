
"""
Authentication views for the Client Portal.
Handles login via Fineract and session validation.
"""
from django.http import JsonResponse
from base64 import b64encode
from client_portal_backend.fineract_gateway.executor import execute_json, GatewayError
from client_portal_backend.auth_app.token_layer import cookie_utils
from client_portal_backend.auth_app.token_layer.token_validator import validate_request_session, get_auth_headers_from_request


def login_view(request):
    # Parse credentials from form or JSON
    username = request.POST.get("username")
    password = request.POST.get("password")
    if not username or not password:
        try:
            import json
            data = json.loads(request.body or b"{}")
            username = username or data.get("username")
            password = password or data.get("password")
        except Exception:
            pass
    if not username or not password:
        return JsonResponse({
            "error": {"code": "invalid_request", "message": "username and password required"}
        }, status=400)

    # Verify against Fineract authentication endpoint; on upstream error, fall back to Basic probe
    try:
        # Fineract expects POST /authentication?username=...&password=...
        _res, _cid = execute_json(path="/authentication", method="POST", query={"username": username, "password": password})
    except GatewayError as e:
        if e.status in (401, 403):
            return JsonResponse({
                "error": {"code": "unauthenticated", "message": "Invalid credentials"},
                "correlationId": e.correlation_id,
            }, status=401)
        # Fallback: try a harmless GET using Basic to validate credentials (works across Fineract versions)
        try:
            b64_probe = b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
            _probe, _pcid = execute_json(path="/clients", query={"limit": 1}, headers_override={"Authorization": f"Basic {b64_probe}"})
        except GatewayError as e2:
            code, status = ("unauthenticated", 401) if e2.status in (401, 403) else ("upstream_error" if e2.status >= 500 else "invalid_request", 502 if e2.status >= 500 else 400)
            return JsonResponse({
                "error": {"code": code, "message": "Authentication service unavailable" if status >= 500 else "Invalid credentials" if status == 401 else "Invalid request"},
                "correlationId": e2.correlation_id,
            }, status=status)

    # Build Basic cookie in passthrough mode
    b64 = b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
    auth_cookie = f"Basic {b64}"
    response = JsonResponse({"status": "ok", "message": "login successful", "user": username})
    response = cookie_utils.set_auth_cookies(response, auth_cookie, "")
    # Persist username in session for convenience
    try:
        if hasattr(request, "session"):
            request.session["auth_user"] = username
    except Exception:
        pass
    return response


def me_view(request):
    # Use cp_session passthrough validation and return basic user info
    result = validate_request_session(request)
    if not result.get("valid"):
        return JsonResponse({
            "error": {"code": "unauthenticated", "message": "Authentication required"}
        }, status=401)

    # Best-effort: query Fineract for user list and match username
    try:
        headers = get_auth_headers_from_request(request)
        raw, _cid = execute_json(path="/users", headers_override=headers)
        data = raw if isinstance(raw, dict) else {}
        items = data.get("pageItems") or data.get("users") or []
        me = None
        for u in items:
            if str(u.get("username")) == str(result.get("username")):
                me = u
                break
        payload = {"status": "ok", "username": result.get("username")}
        if me:
            payload.update({
                "userId": me.get("id"),
                "displayName": me.get("displayName") or me.get("username"),
                "officeName": me.get("officeName")
            })
        return JsonResponse(payload)
    except GatewayError as e:
        # Fall back to username-only if listing users is forbidden; still authenticated
        if e.status in (401, 403):
            return JsonResponse({"status": "ok", "username": result.get("username")})
        return JsonResponse({
            "error": {"code": "upstream_error", "message": "Unable to fetch user info"},
            "correlationId": e.correlation_id,
        }, status=502 if e.status >= 500 else 400)


def logout_view(request):
    """
    Logout endpoint.
    Invalidates the session by deleting the cp_session cookie.
    """
    response = JsonResponse({"status": "ok", "message": "Logged out successfully"})
    response.delete_cookie("cp_session")
    response.delete_cookie("cp_refresh")
    response.delete_cookie("sessionid")
    return response

