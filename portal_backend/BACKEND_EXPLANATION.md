# Backend Code Explanation - For Viva

This document explains every file in the backend, line by line, so you understand what's happening, where, how, and why.

---

## File 1: `portal_backend/settings.py` - Django Configuration

This is the **main configuration file** for Django. It tells Django how to behave, what to use, and how to connect to external services.

### **Lines 1-5: Imports**

```python
import os
from pathlib import Path
from corsheaders.defaults import default_headers
from dotenv import load_dotenv
```

**What:** Importing necessary Python libraries
- `os`: Access environment variables and system functions
- `Path`: Modern way to handle file paths (cross-platform)
- `corsheaders.defaults`: Default CORS headers from django-cors-headers library
- `load_dotenv`: Loads environment variables from `.env` file

**Why:** We need these to configure Django and read settings from environment variables

---

### **Lines 7-11: Database URL Parser (Optional)**

```python
try:
    import dj_database_url
except ImportError:
    dj_database_url = None
```

**What:** Try to import `dj-database-url` library, but don't crash if it's not installed
- `try/except`: Error handling - if import fails, set to `None`
- `dj_database_url`: Library that parses database connection strings (used by Render)

**Why:** Render provides database as a connection string, this library parses it. We make it optional so local development works without it.

---

### **Line 13: Base Directory**

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```

**What:** Gets the absolute path to the project root directory
- `__file__`: Current file (settings.py)
- `.resolve()`: Convert to absolute path
- `.parent.parent`: Go up 2 directories (settings.py → portal_backend → project root)

**Why:** We need to know where the project is located to find other files (templates, static files, database, etc.)

**Example:** `/Users/piyus/Documents/coding/mifos-main/Mifos/portal_backend`

---

### **Line 15: Load Environment Variables**

```python
load_dotenv(BASE_DIR / ".env")
```

**What:** Loads environment variables from `.env` file in project root
- `BASE_DIR / ".env"`: Path to `.env` file
- `load_dotenv()`: Reads the file and makes variables available via `os.getenv()`

**Why:** Keeps sensitive data (passwords, API keys) out of code. Loads from `.env` file.

---

### **Lines 17-18: Security Settings**

```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
```

**What:**
- `SECRET_KEY`: Cryptographic key for signing sessions, cookies, etc.
  - Reads from environment, defaults to dev key if not set
- `DEBUG`: Whether to show detailed error pages
  - Reads from environment, converts "true"/"false" string to boolean

**Why:**
- `SECRET_KEY`: Must be secret in production (used for security)
- `DEBUG`: Should be `False` in production (shows sensitive info if `True`)

---

### **Lines 21-31: Allowed Hosts**

```python
ALLOWED_HOSTS: list[str] = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",  # Render subdomains
    ".render.com",    # Render domains
]
if os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(os.getenv("RENDER_EXTERNAL_HOSTNAME"))
if os.getenv("ALLOWED_HOSTS"):
    ALLOWED_HOSTS.extend(os.getenv("ALLOWED_HOSTS").split(","))
```

**What:** List of hostnames/domains Django will accept requests from
- Default: localhost and Render domains
- Can add custom domains from environment variables

**Why:** Security feature - prevents HTTP Host header attacks. Django only responds to requests from these hosts.

**Example:** If someone tries to access via `evil.com`, Django rejects it.

---

### **Lines 33-43: Installed Apps**

```python
INSTALLED_APPS = [
    "django.contrib.admin",      # Django admin interface
    "django.contrib.auth",       # Authentication system
    "django.contrib.contenttypes", # Content type framework
    "django.contrib.sessions",   # Session framework
    "django.contrib.messages",   # Messaging framework
    "django.contrib.staticfiles", # Static file handling
    "rest_framework",            # Django REST Framework
    "corsheaders",               # CORS middleware
    "core",                      # Our custom app
]
```

**What:** List of Django applications (modules) to use
- `django.contrib.*`: Built-in Django apps (admin, auth, sessions, etc.)
- `rest_framework`: Adds REST API capabilities
- `corsheaders`: Handles Cross-Origin Resource Sharing (CORS)
- `core`: Our custom app (contains views, URLs, etc.)

**Why:** Django needs to know which apps to load. Each app provides features.

---

### **Lines 45-67: Middleware**

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
]
# Add WhiteNoise conditionally
try:
    import whitenoise
    if not DEBUG:
        MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")
except ImportError:
    pass
MIDDLEWARE.extend([
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
])
```

**What:** Middleware = code that runs on every request (like filters)
- **Order matters!** They execute top to bottom on request, bottom to top on response
- `SecurityMiddleware`: Adds security headers (HTTPS redirect, etc.)
- `WhiteNoiseMiddleware`: Serves static files in production (only if installed and not DEBUG)
- `SessionMiddleware`: Manages user sessions (cookies)
- `CorsMiddleware`: Handles CORS headers (allows frontend to call backend)
- `CommonMiddleware`: Common utilities (URL rewriting, etc.)
- `CsrfViewMiddleware`: CSRF protection (prevents cross-site request forgery)
- `AuthenticationMiddleware`: Adds `request.user` object
- `MessagesMiddleware`: Flash messages framework
- `XFrameOptionsMiddleware`: Prevents clickjacking attacks

**Why:** Middleware processes every request/response. Order is critical - CORS must be before CSRF, sessions before auth, etc.

**Flow:** Request → Security → WhiteNoise → Sessions → CORS → Common → CSRF → Auth → Messages → XFrame → View → (reverse order) → Response

---

### **Line 69: Root URL Configuration**

```python
ROOT_URLCONF = "portal_backend.urls"
```

**What:** Points to the main URL routing file
- Django looks here to know which URLs map to which views

**Why:** Central entry point for all URL routing

---

### **Lines 71-85: Templates Configuration**

```python
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
```

**What:** Configures Django template engine (for rendering HTML)
- `BACKEND`: Which template engine to use (Django's built-in)
- `DIRS`: Additional template directories (empty = use app directories)
- `APP_DIRS`: Auto-find templates in each app's `templates/` folder
- `context_processors`: Functions that add variables to all templates
  - `debug`: Adds DEBUG setting
  - `request`: Adds request object
  - `auth`: Adds user object
  - `messages`: Adds flash messages

**Why:** We're using REST API (JSON), so templates aren't used much, but Django requires this config.

---

### **Line 87: WSGI Application**

```python
WSGI_APPLICATION = "portal_backend.wsgi.application"
```

**What:** Points to WSGI application (Web Server Gateway Interface)
- WSGI = standard interface between web server and Python web apps
- Used by production servers (Gunicorn, uWSGI)

**Why:** Production servers need this to run Django

---

### **Lines 89-102: Database Configuration**

```python
if os.getenv("DATABASE_URL") and dj_database_url:
    # Render provides DATABASE_URL for PostgreSQL
    DATABASES = {
        "default": dj_database_url.parse(os.getenv("DATABASE_URL"))
    }
else:
    # Local development - use SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
```

**What:** Configures database connection
- **If `DATABASE_URL` exists** (production/Render): Use PostgreSQL
  - Parses connection string like `postgresql://user:pass@host:port/dbname`
- **Else** (local development): Use SQLite
  - SQLite = file-based database (no server needed)

**Why:** 
- Production needs PostgreSQL (better performance, concurrent access)
- Local development uses SQLite (simpler, no setup needed)

**Example DATABASE_URL:** `postgresql://user:password@host:5432/dbname`

---

### **Line 104: Password Validators**

```python
AUTH_PASSWORD_VALIDATORS: list[dict] = []
```

**What:** List of password validation rules (empty = no validation)
- Normally Django has validators (min length, complexity, etc.)
- We disabled them because we're not using Django's auth system

**Why:** We use custom authentication (client portal login), so we don't need Django's password validators

---

### **Lines 106-109: Internationalization**

```python
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
```

**What:** 
- `LANGUAGE_CODE`: Default language (English US)
- `TIME_ZONE`: Default timezone (UTC = Coordinated Universal Time)
- `USE_I18N`: Enable internationalization (multiple languages)
- `USE_TZ`: Use timezone-aware datetimes

**Why:** Standard Django settings for handling dates/times and languages

---

### **Lines 111-120: Static Files**

```python
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

try:
    import whitenoise
    if not DEBUG:
        STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
except ImportError:
    pass
```

**What:** Configuration for static files (CSS, JS, images)
- `STATIC_URL`: URL prefix for static files (`/static/`)
- `STATIC_ROOT`: Where to collect static files for production
- `STATICFILES_STORAGE`: Use WhiteNoise to serve static files in production (compressed, cached)

**Why:** 
- Development: Django serves static files automatically
- Production: WhiteNoise serves them efficiently (compressed, cached)

---

### **Line 122: Default Auto Field**

```python
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
```

**What:** Default type for auto-incrementing primary keys in models
- `BigAutoField` = 64-bit integer (supports very large IDs)

**Why:** Django 3.2+ default. Prevents ID overflow issues.

---

### **Lines 124-171: CORS Configuration**

```python
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

# Add Render frontend URL if provided
if os.getenv("FRONTEND_URL"):
    frontend_url = os.getenv("FRONTEND_URL")
    if not frontend_url.startswith("http"):
        frontend_url = f"https://{frontend_url}"
    if frontend_url not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(frontend_url)

# Add from CORS_ALLOWED_ORIGINS env var if provided
if os.getenv("CORS_ALLOWED_ORIGINS"):
    origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS").split(",")]
    for origin in origins:
        if origin and origin not in CORS_ALLOWED_ORIGINS:
            if not origin.startswith("http"):
                origin = f"https://{origin}"
            CORS_ALLOWED_ORIGINS.append(origin)

# In production, allow any .onrender.com subdomain
if not DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://.*\.onrender\.com$",
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = True
```

**What:** CORS = Cross-Origin Resource Sharing
- Allows frontend (different domain/port) to call backend API
- `CORS_ALLOW_CREDENTIALS`: Allow cookies/credentials in CORS requests
- `CORS_ALLOWED_ORIGINS`: Specific allowed origins (localhost, Render frontend)
- `CORS_ALLOWED_ORIGIN_REGEXES`: Pattern matching for origins (any `.onrender.com`)
- Development: Allow all origins (for testing)
- Production: Only allow specific origins (security)

**Why:** 
- Browser security: By default, browsers block cross-origin requests
- We need CORS because frontend (localhost:4200 or Render) calls backend (localhost:8000 or Render)
- Credentials needed for session cookies

**Example:** Frontend at `https://myapp.onrender.com` can call backend at `https://backend.onrender.com`

---

### **Lines 159-171: CORS Headers**

```python
CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-Correlation-ID",
    "Fineract-Platform-TenantId",
    "fineract-platform-tenantid",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
]
CORS_EXPOSE_HEADERS = [
    "X-Correlation-ID",
]
CORS_PREFLIGHT_MAX_AGE = 86400
```

**What:**
- `CORS_ALLOW_HEADERS`: Headers frontend can send
  - Custom headers: `X-Correlation-ID` (for request tracking), Fineract tenant headers
- `CORS_EXPOSE_HEADERS`: Headers backend can send (frontend can read)
- `CORS_PREFLIGHT_MAX_AGE`: Cache preflight requests for 24 hours (86400 seconds)

**Why:** 
- Fineract requires tenant headers
- Correlation ID for debugging/tracking
- Preflight caching reduces requests

---

### **Lines 173-176: Session Cookie Configuration**

```python
SESSION_COOKIE_NAME = "cp_session"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG
```

**What:** Session cookie settings
- `SESSION_COOKIE_NAME`: Cookie name (`cp_session` = Client Portal session)
- `SESSION_COOKIE_HTTPONLY`: JavaScript can't access cookie (prevents XSS attacks)
- `SESSION_COOKIE_SAMESITE`: When to send cookie (`Lax` = same-site + top-level navigation)
- `SESSION_COOKIE_SECURE`: Only send over HTTPS (production only)

**Why:** Security best practices for session management

---

### **Lines 178-183: Fineract Configuration**

```python
MIFOS_BASE_URL = os.getenv("MIFOS_BASE_URL", "https://localhost:8443/fineract-provider/api/v1")
MIFOS_TENANT_ID = os.getenv("MIFOS_TENANT_ID", "default")
MIFOS_ADMIN_USER = os.getenv("MIFOS_ADMIN_USER", "mifos")
MIFOS_ADMIN_PASS = os.getenv("MIFOS_ADMIN_PASS", "password")
MIFOS_VERIFY_SSL = os.getenv("MIFOS_VERIFY_SSL", "true").lower() == "true"
MIFOS_CLIENT_ID = os.getenv("MIFOS_CLIENT_ID", "3")
```

**What:** Configuration for connecting to Fineract (core banking engine)
- `MIFOS_BASE_URL`: Fineract API base URL
- `MIFOS_TENANT_ID`: Fineract tenant identifier (multi-tenancy)
- `MIFOS_ADMIN_USER`: Admin username for Fineract
- `MIFOS_ADMIN_PASS`: Admin password for Fineract
- `MIFOS_VERIFY_SSL`: Whether to verify SSL certificates (false for self-signed)
- `MIFOS_CLIENT_ID`: Which client to fetch data for

**Why:** 
- Django backend acts as middleware between frontend and Fineract
- Uses admin credentials to fetch client data
- Client ID determines which client's data to show

**Example:** Backend uses `mifos/password` to login to Fineract, then fetches data for client ID 3

---

### **Lines 185-212: Logging Configuration**

```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "mifos_client": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "core": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}
```

**What:** Python logging configuration
- `formatters`: How to format log messages
  - `verbose`: Shows level, timestamp, module, message
- `handlers`: Where to send logs
  - `console`: Print to console/terminal
- `loggers`: Which modules to log
  - `mifos_client`: Logs from Fineract client code (DEBUG level)
  - `core`: Logs from our views/URLs (DEBUG level)
  - `propagate: False`: Don't send to parent loggers

**Why:** 
- Debugging: See what's happening in code
- Monitoring: Track errors and requests
- DEBUG level shows everything (can change to INFO/WARNING in production)

**Example Log Output:**
```
DEBUG 2025-12-09 10:30:45,123 mifos_client Mifos admin fetch
INFO 2025-12-09 10:30:45,456 core Login request received
```

---

## Summary of settings.py

**Purpose:** Central configuration file that tells Django:
1. **Security:** Secret keys, allowed hosts, CORS, sessions
2. **Database:** PostgreSQL (production) or SQLite (local)
3. **Middleware:** Request/response processing pipeline
4. **Apps:** Which Django apps to use
5. **External Services:** Fineract connection details
6. **Logging:** How to log events

**Key Concepts:**
- Environment variables for configuration (security, flexibility)
- Conditional logic (production vs development)
- Security best practices (CORS, sessions, HTTPS)
- Middleware pipeline (order matters!)

---

**Next File:** `core/views.py` - API endpoints and business logic

