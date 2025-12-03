
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent


# BACKEND-PLACEHOLDER-START
"""
Minimal Django settings placeholder for client_portal_backend.
No real configuration, databases, middleware, or apps are defined.
"""

# Core metadata (placeholders only)
SECRET_KEY = "PLACEHOLDER_SECRET_KEY"
DEBUG = True
ALLOWED_HOSTS = ["*"]

# Project references (placeholders)
ROOT_URLCONF = "client_portal_backend.urls"
WSGI_APPLICATION = "client_portal_backend.wsgi.application"
ASGI_APPLICATION = "client_portal_backend.asgi.application"

# Apps and middleware (minimal runnable set)
INSTALLED_APPS = [
    # BACKEND-PLACEHOLDER-START
    "django.contrib.auth",
    "django.contrib.contenttypes",
    'django.contrib.sessions',
    "django.contrib.staticfiles",
    # BACKEND-PLACEHOLDER-START
    "client_portal_backend.auth_app",
    # BACKEND-PLACEHOLDER-END
]
MIDDLEWARE = [
    # BACKEND-PLACEHOLDER-START
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # BACKEND-PLACEHOLDER-END
]

# BACKEND-PLACEHOLDER-START
# (placeholder) 'client_portal_backend.auth_app.middleware.session_guard.ClientPortalSessionMiddleware'
# BACKEND-PLACEHOLDER-END

# Templates (minimal placeholder)
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

# Internationalization (placeholder values)
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (placeholder)
STATIC_URL = "/static/"
# BACKEND-PLACEHOLDER-END

# BACKEND-PLACEHOLDER-START
# Minimal logging to surface placeholder auth debug logs in development
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
# BACKEND-PLACEHOLDER-END
