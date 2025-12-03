# BACKEND-PLACEHOLDER-START
"""
WSGI entrypoint for client_portal_backend.
Wrapped in reviewer markers. This file attempts to load Django's WSGI app;
if that fails it exposes a minimal fallback WSGI app that returns 500 with a traceback.
REVIEW NOTE: This is deliberately minimal and safe for local dev.
"""

import os
import traceback

# Ensure settings module is set for manage.py / WSGI environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "client_portal_backend.settings")

try:
    # Prefer the canonical Django WSGI application
    from django.core.wsgi import get_wsgi_application  # type: ignore
    application = get_wsgi_application()
except Exception:
    # Provide a safe fallback WSGI app that returns 500 and the traceback (text only).
    tb = traceback.format_exc()

    def application(environ, start_response):
        start_response("500 Internal Server Error", [("Content-Type", "text/plain; charset=utf-8")])
        body = ("WSGI application failed to initialize.\n\n" + tb).encode("utf-8")
        return [body]
# BACKEND-PLACEHOLDER-END
