#!/bin/bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "=== Preparing backup folder ==="
mkdir -p ./backup

echo "=== Checking free ports ==="
bash ./check-ports.sh
set -a; source .env; set +a

echo "=== Building and starting services ==="
docker compose up -d --build --remove-orphans

echo "=== backend: migrations, data, GeoServer ==="
(cd ./backend && bash start.sh)

echo
# echo "Frontend  : http://localhost:${FRONTEND_PORT}"
echo "Backend   : http://localhost:${BACKEND_PORT}/docs"
echo "GeoServer : http://localhost:${GEOSERVER_PORT}/geoserver"
echo "Database  : localhost:${DB_PORT}"
echo
echo "=== Public link (Cloudflare tunnel) ==="
bash ./tunnel-links.sh
echo "Done."
