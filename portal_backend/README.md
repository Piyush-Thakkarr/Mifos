# Client Portal Backend (Django)

This Django project (`portal_backend`) provides a middleware backend for the Angular `clientportal` module.

## Features (Day 1)

- Fixed-credential login endpoint at `POST /auth/login`.
- Session-based authentication using Django sessions and a cookie named `cp_session`.
- Placeholder dashboard endpoint at `GET /dashboard`.
- Placeholder Mifos connector (`mifos_client.MifosClient`) for future Fineract API integration.

## Environment Variables

Configured via `.env` (loaded by `python-dotenv`):

- `MIFOS_BASE_URL` — default `https://localhost:8443/fineract-provider/api/v1`
- `MIFOS_TENANT_ID` — default `default`
- `MIFOS_ADMIN_USER` — default `mifos`
- `MIFOS_ADMIN_PASS` — default `password`
- `DJANGO_SECRET_KEY` — required in production (default development key if unset)
- `DEBUG` — `True` or `False` (default `True`)

## Session & Cookie Configuration

- Session storage: Django sessions (SQLite by default).
- Cookie name: `cp_session`
- `SESSION_COOKIE_HTTPONLY = True`
- `SESSION_COOKIE_SAMESITE = "Lax"`
- `SESSION_COOKIE_SECURE = not DEBUG`

## CORS

CORS is configured to allow Angular frontends from:

- `http://localhost:4200`
- `http://127.0.0.1:4200`

with `CORS_ALLOW_CREDENTIALS = True` so cookies (sessions) can be used.

## Running Locally

```bash
cd Mifos/portal_backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # adjust values if needed
python manage.py migrate
python manage.py runserver 8000
```

Backend will listen on `http://localhost:8000`.

## Endpoints

### `POST /auth/login`

Request body (JSON):

```json
{ "username": "client", "password": "password" }
```

Behavior:

- If username == `client` and password == `password`:
  - Stores `{"username": "client"}` in `request.session["cp_user"]`.
  - Returns HTTP 200 JSON:
    - `{ "username": "client", "display_name": "client" }`.
  - Django sets `cp_session` cookie via session middleware.
- Else:
  - Returns HTTP 401 JSON:
    - `{ "error": "invalid_credentials", "correlation_id": "<uuid>" }`.

### `GET /dashboard`

- If `request.session["cp_user"]` is missing:
  - Returns HTTP 401 JSON with `{ "error": "unauthorized", "correlation_id": "<uuid>" }`.
- If present:
  - Returns HTTP 200 JSON:
    - `{ "message": "dashboard placeholder", "user": {"username": "client"} }`.

## Quick curl Tests

Successful login:

```bash
curl -i -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"password"}'
```

Failed login:

```bash
curl -i -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"foo","password":"bar"}'
```

Dashboard after login using cookie jar:

```bash
curl -c cookies.txt -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"password"}'

curl -b cookies.txt http://127.0.0.1:8000/dashboard
```
