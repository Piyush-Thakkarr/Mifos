#!/bin/bash
# Start script for Django backend on Render

set -e

cd "$(dirname "$0")"

# Run migrations
python manage.py migrate --noinput || true

# Start Gunicorn
exec gunicorn portal_backend.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${WORKERS:-2} \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

