"""
ASGI entrypoint for client_portal_backend.
"""

import os
import traceback

# Ensure settings module is set for manage.py / ASGI environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "client_portal_backend.settings")

try:
    # Prefer the canonical Django ASGI application
    from django.core.asgi import get_asgi_application  # type: ignore
    application = get_asgi_application()
except Exception:
    # Provide a safe fallback ASGI app that returns 500 and the traceback (text only).
    tb = traceback.format_exc()

    async def application(scope, receive, send):
        assert scope["type"] == "http"
        body = ("ASGI application failed to initialize.\n\n" + tb).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 500,
                "headers": [(b"content-type", b"text/plain; charset=utf-8")],
            }
        )
        await send({"type": "http.response.body", "body": body})

