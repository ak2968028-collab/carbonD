#!/bin/bash
# Regenerate the migration from the models, load all CSV data, then publish GeoServer layers.
# Needs the stack running (docker compose up -d) and pandas/sqlalchemy/psycopg2 on the host.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE=(docker compose -f "$PROJECT_DIR/docker-compose.yml")

echo "=== Waiting for backend and GeoServer ==="
for _ in $(seq 1 60); do
    if "${COMPOSE[@]}" exec -T backend python -c "import urllib.request as u; u.urlopen('http://localhost:7200/'); u.urlopen('http://geoserver:8080/geoserver/web/')" >/dev/null 2>&1; then
        break
    fi
    sleep 5
done

echo "=== Alembic: regenerate migration from models ==="
# The old revision files are deleted, so forget the old revision id too
# (otherwise autogenerate fails with "Can't locate revision ...").
"${COMPOSE[@]}" exec -T database sh -c 'psql -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP TABLE IF EXISTS alembic_version"'
"${COMPOSE[@]}" exec -T backend bash -c "
    rm -rf alembic/versions/*.py alembic/versions/__pycache__ &&
    alembic revision --autogenerate -m 'new update' &&
    alembic upgrade head
"

echo "=== Loading CSV data ==="
python "$SCRIPT_DIR/media/run.py"

echo "=== Publishing layers to GeoServer ==="
"${COMPOSE[@]}" exec -T backend bash -c "
    cd script &&
    python push_to_geoserver.py
"

echo "All tasks completed successfully."
