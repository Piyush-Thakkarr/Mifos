# Client Portal Backend Summary (Day 1)

## Project & Paths

- **Backend project root**: `Mifos/portal_backend`
- **Django project package**: `portal_backend/`
- **Core app**: `core/`
- **Mifos connector package**: `mifos_client/`

## Key Files

- **Django project**
  - `portal_backend/manage.py`
  - `portal_backend/portal_backend/settings.py`
  - `portal_backend/portal_backend/urls.py`
  - `portal_backend/portal_backend/asgi.py`
  - `portal_backend/portal_backend/wsgi.py`

- **Core app**
  - `portal_backend/core/__init__.py`
  - `portal_backend/core/apps.py`
  - `portal_backend/core/views.py`
  - `portal_backend/core/urls.py`
  - `portal_backend/core/admin.py`
  - `portal_backend/core/tests.py`
  - `portal_backend/core/migrations/__init__.py`

- **Mifos connector (placeholder)**
  - `portal_backend/mifos_client/__init__.py`
  - `portal_backend/mifos_client/client.py`

- **Config & docs**
  - `portal_backend/requirements.txt`
  - `portal_backend/.env.example`
  - `portal_backend/README.md`

## Settings Overview

- Uses SQLite by default for the database.
- `INSTALLED_APPS` includes:
  - Core Django apps
  - `rest_framework`
  - `corsheaders`
  - `core`
- Middleware includes:
  - `SessionMiddleware`
  - `CorsMiddleware`
  - `CsrfViewMiddleware`
  - `AuthenticationMiddleware`
  - Standard Django common, messages, security, clickjacking.

### Session & Cookie

- `SESSION_COOKIE_NAME = 'cp_session'`
- `SESSION_COOKIE_HTTPONLY = True`
- `SESSION_COOKIE_SAMESITE = 'Lax'`
- `SESSION_COOKIE_SECURE = not DEBUG`

### CORS

- `CORS_ALLOW_CREDENTIALS = True`
- `CORS_ALLOWED_ORIGINS`:
  - `http://localhost:4200`
  - `http://127.0.0.1:4200`

### Mifos / Fineract Config (for future use)

- `MIFOS_BASE_URL` (default `https://localhost:8443/fineract-provider/api/v1`)
- `MIFOS_TENANT_ID` (default `default`)
- `MIFOS_ADMIN_USER` (default `mifos`)
- `MIFOS_ADMIN_PASS` (default `password`)

Loaded from `.env` via `python-dotenv`.

## Endpoints

### `POST /auth/login`

- Implemented in `core.views.login_view` and wired via `core.urls` → `portal_backend.urls`.
- Accepts JSON body:
  - `{ "username": "...", "password": "..." }`
- Behavior (Day 2):
  - Calls `MifosClient.validate_client_credentials(username, password)` which:
    - Builds the Fineract URL `${MIFOS_BASE_URL}/authentication`.
    - Sends a GET with Basic Auth `(username, password)` and:
      - Query param `tenantIdentifier=<MIFOS_TENANT_ID>`.
      - Header `Fineract-Platform-TenantId: <MIFOS_TENANT_ID>`.
  - If Fineract returns 200:
    - Normalizes user info into `{ "username", "displayName", "raw" }`.
    - Stores `{ "username", "displayName" }` in `request.session['cp_user']`.
    - Returns HTTP 200 JSON `{ "username", "display_name" }`.
    - Django session middleware sets the `cp_session` cookie.
  - If Fineract returns 401/403:
    - Raises `MifosAuthError`.
    - View logs a warning with a `correlation_id` and returns HTTP 401 JSON:
      - `{ "error": "invalid_credentials", "correlation_id": "<uuid>" }`.
  - If a network error or unexpected status occurs:
    - Raises `MifosUpstreamError`.
    - View logs an exception with `correlation_id` and returns HTTP 503 JSON:
      - `{ "error": "upstream_unavailable", "correlation_id": "<uuid>" }`.

### `GET /auth/me`

- Implemented in `core.views.me_view`.
- Behavior:
  - If `request.session['cp_user']` exists:
    - Returns HTTP 200 JSON with the stored user object `{ "username", "displayName" }`.
  - If not:
    - Returns HTTP 401 JSON with `{ "error": "unauthorized", "correlation_id": "<uuid>" }`.

### `GET /dashboard`

- Implemented in `core.views.dashboard_view`.
- Behavior (Day 2):
  - Checks `request.session.get('cp_user')`.
  - If missing:
    - Logs an info message with `correlation_id` and returns HTTP 401 JSON:
      - `{ "error": "unauthorized", "correlation_id": "<uuid>" }`.
  - If present:
    - Returns HTTP 200 JSON:
      - ```json
        {
          "authenticated": true,
          "user": { "username": "...", "displayName": "..." },
          "message": "Dashboard API functional — ready for Day 3–7 Fineract integration"
        }
        ```

## Mifos Connector Placeholder

- **File**: `portal_backend/mifos_client/client.py`
- **Class**: `MifosClient`
  - Reads:
    - `settings.MIFOS_BASE_URL`
    - `settings.MIFOS_TENANT_ID`
    - `settings.MIFOS_ADMIN_USER`
    - `settings.MIFOS_ADMIN_PASS`
  - Exposes stub methods:
    - `auth_check()` — no-op placeholder.
    - `fetch_with_admin(path, method='GET', **kwargs)` — returns a simple dict with the target URL and metadata.
- Real Fineract HTTP calls will be implemented in later phases.

## Environment & Requirements

- **requirements.txt** includes:
  - `Django`
  - `djangorestframework`
  - `requests`
  - `python-dotenv`
  - `django-cors-headers`

- **.env.example** contains:
  - `MIFOS_BASE_URL`
  - `MIFOS_TENANT_ID`
  - `MIFOS_ADMIN_USER`
  - `MIFOS_ADMIN_PASS`
  - `DJANGO_SECRET_KEY`
  - `DEBUG`
   - `MIFOS_VERIFY_SSL` (set to `True` by default)

## How to Run Backend Locally

```bash
cd Mifos/portal_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # adjust as needed
python manage.py migrate
python manage.py runserver 8000
```

Backend will listen on `http://localhost:8000`.

## curl Smoke Tests

### Successful Login

```bash
curl -i -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"password"}'
```

Expected:

- `HTTP/1.1 200 OK`
- `Set-Cookie: cp_session=...; HttpOnly; SameSite=Lax; Path=/; ...`
- JSON body with `username: "client"`.

### Failed Login

```bash
curl -i -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"foo","password":"bar"}'
```

Expected:

- `HTTP/1.1 401 Unauthorized`
- JSON `{ "error": "invalid_credentials", "correlation_id": "..." }`.

### Dashboard After Login

```bash
curl -c cookies.txt -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"password"}'

curl -b cookies.txt http://127.0.0.1:8000/dashboard
```

Expected:

- `HTTP/1.1 200 OK`
- JSON similar to `{ "message": "dashboard placeholder", "user": {"username": "client"} }`.

## TODO / Next Steps (Backend)

- Implement real Mifos/Fineract calls inside `MifosClient`.
- Add error logging with correlation IDs persisted to logs for production debugging.
- Harden security (CSRF for non-AJAX forms, stricter CORS in production, etc.).
