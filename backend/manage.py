# BACKEND-PLACEHOLDER-START
"""
Minimal manage.py to run the placeholder client_portal_backend.
REVIEW NOTE: This enables `python manage.py runserver` without adding secrets
or DB requirements. Settings remain minimal and safe for local dev only.
"""

import os
import sys


def main() -> None:
    # BACKEND-PLACEHOLDER-START
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "client_portal_backend.settings")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
    # BACKEND-PLACEHOLDER-END


if __name__ == "__main__":
    main()
# BACKEND-PLACEHOLDER-END
