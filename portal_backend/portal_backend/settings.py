import os
from pathlib import Path

from corsheaders.defaults import default_headers
from dotenv import load_dotenv

# Import dj-database-url for Render PostgreSQL support
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Allow Render and localhost
ALLOWED_HOSTS: list[str] = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",  # Render subdomains
    ".render.com",    # Render domains
]
# Add custom domain if provided
if os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(os.getenv("RENDER_EXTERNAL_HOSTNAME"))
if os.getenv("ALLOWED_HOSTS"):
    ALLOWED_HOSTS.extend(os.getenv("ALLOWED_HOSTS").split(","))

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "core",
]

# Build middleware list - add WhiteNoise if available and in production
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
]

# Add WhiteNoise for static files in production (only if installed)
try:
    import whitenoise
    if not DEBUG:
        MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")
except ImportError:
    pass  # WhiteNoise not installed, skip it

# Add remaining middleware
MIDDLEWARE.extend([
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
])

ROOT_URLCONF = "portal_backend.urls"

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

WSGI_APPLICATION = "portal_backend.wsgi.application"

# Database configuration - use PostgreSQL on Render, SQLite locally
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

AUTH_PASSWORD_VALIDATORS: list[dict] = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise for serving static files in production (only if installed)
try:
    import whitenoise
    if not DEBUG:
        STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
except ImportError:
    pass  # WhiteNoise not installed, skip it

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS Configuration
CORS_ALLOW_CREDENTIALS = True

# CORS origins - support both local and production
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

# Add from CORS_ALLOWED_ORIGINS env var if provided (comma-separated)
if os.getenv("CORS_ALLOWED_ORIGINS"):
    origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS").split(",")]
    for origin in origins:
        if origin and origin not in CORS_ALLOWED_ORIGINS:
            if not origin.startswith("http"):
                origin = f"https://{origin}"
            CORS_ALLOWED_ORIGINS.append(origin)

# In production, allow any .onrender.com subdomain for flexibility
if not DEBUG:
    # Allow any Render subdomain (regex pattern)
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://.*\.onrender\.com$",
    ]
else:
    # Allow all origins in development (for local testing)
    CORS_ALLOW_ALL_ORIGINS = True
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
# Allow preflight requests to be cached
CORS_PREFLIGHT_MAX_AGE = 86400

# Session configuration
# Use signed cookies instead of database sessions for simplicity on Render
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"
SESSION_COOKIE_NAME = "cp_session"
SESSION_COOKIE_HTTPONLY = True
# Use None for cross-origin requests (frontend and backend on different domains)
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_COOKIE_SECURE = True  # Always True when SameSite=None (required by browsers)
SESSION_COOKIE_AGE = 86400  # 24 hours

MIFOS_BASE_URL = os.getenv("MIFOS_BASE_URL", "https://localhost:8443/fineract-provider/api/v1")
MIFOS_TENANT_ID = os.getenv("MIFOS_TENANT_ID", "default")
MIFOS_ADMIN_USER = os.getenv("MIFOS_ADMIN_USER", "mifos")
MIFOS_ADMIN_PASS = os.getenv("MIFOS_ADMIN_PASS", "password")
MIFOS_VERIFY_SSL = os.getenv("MIFOS_VERIFY_SSL", "true").lower() == "true"
MIFOS_CLIENT_ID = os.getenv("MIFOS_CLIENT_ID", "3")

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
