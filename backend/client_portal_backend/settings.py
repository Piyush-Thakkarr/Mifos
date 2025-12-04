
from pathlib import Path
import os
BASE_DIR = Path(__file__).resolve().parent.parent



"""
Django settings for client_portal_backend.
Configured for local development with Fineract integration.
"""

# Core metadata (placeholders only)
SECRET_KEY = os.environ.get("SECRET_KEY", "PLACEHOLDER_SECRET_KEY")
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = ["*"]

# Project references
ROOT_URLCONF = "client_portal_backend.urls"
WSGI_APPLICATION = "client_portal_backend.wsgi.application"
ASGI_APPLICATION = "client_portal_backend.asgi.application"

# Apps and middleware (minimal runnable set)
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    'django.contrib.sessions',
    "django.contrib.staticfiles",

    "client_portal_backend.auth_app",

]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

]



# Templates
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    }
]

# Minimal database configuration (in-memory SQLite). No migrations will be run.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "/static/"



# Minimal logging to surface auth debug logs in development
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        }
    },
    "loggers": {
        "client_portal.auth": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        }
    },
}

# CORS configuration (configurable for Render / prod)
_cors_env = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:4200")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'fineract-platform-tenantid',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
