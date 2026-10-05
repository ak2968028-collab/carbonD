#!/bin/bash
# Print the public link (Cloudflare tunnel -> gateway) and write it into frontend/.env.local.
# Uses PUBLIC_URL from .env when set (own domain), otherwise the trycloudflare.com URL
# from the cloudflared logs (it changes whenever the cloudflared container restarts).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

set -a; source .env; set +a
ENV_FILE="frontend/.env.local"

if [ -n "${PUBLIC_URL:-}" ]; then
    BASE="${PUBLIC_URL%/}"
else
    BASE=""
    for _ in $(seq 1 30); do
        BASE=$(docker compose logs cloudflared 2>/dev/null | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1 || true)
        [ -n "$BASE" ] && break
        sleep 2
    done
    if [ -z "$BASE" ]; then
        echo "No tunnel URL in the cloudflared logs yet (is it running? docker compose up -d cloudflared)" >&2
        exit 1
    fi
fi

API_URL="$BASE"
GEO_URL="$BASE/geoserver"

check() {
    local code=""
    for _ in $(seq 1 10); do
        code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$1" || true)
        [[ "$code" =~ ^2 ]] && break
        sleep 3
    done
    if [[ "$code" =~ ^2 ]]; then echo "ok"; else echo "NOT reachable yet ($code)"; fi
}

cat > "$ENV_FILE" <<ENV
# Written by tunnel-links.sh (public link via Cloudflare tunnel -> gateway)
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_GEOSERVER_URL=$GEO_URL
ENV

echo "Public link : $BASE"
echo "  Backend   : $API_URL/docs -> $(check "$API_URL/api/health")"
echo "  GeoServer : $GEO_URL (map services only) -> $(check "$GEO_URL/ows?service=WMS&request=GetCapabilities")"
echo "Written to $ENV_FILE (npm run dev reloads it)."
echo "For Vercel: set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_GEOSERVER_URL to the values above and redeploy."
