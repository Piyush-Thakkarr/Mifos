#!/bin/bash
# Build script for Django backend on Render

set -e

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Running migrations..."
python manage.py migrate --noinput || true

echo "Build complete!"

