#!/bin/bash
# =========================================
# CarbonCred - Django Entrypoint Script
# =========================================
# Waits for PostgreSQL, runs migrations, then starts Gunicorn

set -e

echo "========================================="
echo " CarbonCred Backend Starting..."
echo "========================================="

# ── Wait for PostgreSQL ──────────────────────────────────────────
echo ">>> Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until nc -z -v -w30 "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  echo "  PostgreSQL not ready — retrying in 2 seconds..."
  sleep 2
done
echo ">>> PostgreSQL is ready!"

# ── Run Django migrations ────────────────────────────────────────
echo ">>> Running database migrations..."
python manage.py migrate --noinput

# ── Collect static files ─────────────────────────────────────────
echo ">>> Collecting static files..."
python manage.py collectstatic --noinput

# ── Start Gunicorn ───────────────────────────────────────────────
echo ">>> Starting Gunicorn on 0.0.0.0:8000..."
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
