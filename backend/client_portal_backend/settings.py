
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent



"""
Django settings for client_portal_backend.
Configured for local development with Fineract integration.
"""

# Core metadata
SECRET_KEY = "PLACEHOLDER_SECRET_KEY"
DEBUG = True
ALLOWED_HOSTS = ["*"]

# Project references
ROOT_URLCONF = "client_portal_backend.urls"
WSGI_APPLICATION = "client_portal_backend.wsgi.application"
ASGI_APPLICATION = "client_portal_backend.asgi.application"

# Apps and middleware (minimal runnable set)
INSTALLED_APPS = [

    "django.contrib.auth",
    "django.contrib.contenttypes",
    'django.contrib.sessions',
    "django.contrib.staticfiles",

    "client_portal_backend.auth_app",

]
MIDDLEWARE = [

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

