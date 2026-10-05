#!/bin/bash
# Make sure every host port in .env is free; if one is taken, bump it to the next free port.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

declare -A DEFAULTS=([FRONTEND_PORT]=3200 [BACKEND_PORT]=7200 [DB_PORT]=5460 [GEOSERVER_PORT]=8095)
[ -f .env ] || touch .env

in_use() { ss -tlnH "sport = :$1" | grep -q .; }
TAKEN=()

for KEY in FRONTEND_PORT BACKEND_PORT DB_PORT GEOSERVER_PORT; do
    PORT=$(grep -E "^${KEY}=" .env | cut -d= -f2 || true)
    PORT=${PORT:-${DEFAULTS[$KEY]}}
    # Ports held by our own running containers are fine to reuse
    OWN=$(docker ps --filter label=com.docker.compose.project=dashboard --format '{{.Ports}}' 2>/dev/null | grep -o ":$PORT->" || true)
    while { [ -z "$OWN" ] && in_use "$PORT"; } || [[ " ${TAKEN[*]-} " == *" $PORT "* ]]; do
        PORT=$((PORT + 1)); OWN=""
    done
    TAKEN+=("$PORT")
    if grep -qE "^${KEY}=" .env; then sed -i "s/^${KEY}=.*/${KEY}=${PORT}/" .env; else echo "${KEY}=${PORT}" >> .env; fi
    printf "%-15s %s\n" "$KEY" "$PORT"
done
