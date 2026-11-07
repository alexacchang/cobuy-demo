#!/usr/bin/env bash
# Regenerates public/sample-invoice.png from /sample-invoice (rendered from data/invoice.json).
# Usage: scripts/render-invoice.sh            (starts its own dev server on port 3102)
#        BASE_URL=http://localhost:3100 scripts/render-invoice.sh   (use an already running server)
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT="${PORT:-3102}"
BASE_URL="${BASE_URL:-}"
OUT="public/sample-invoice.png"
SERVER_PID=""

if [ -z "$BASE_URL" ]; then
  BASE_URL="http://localhost:$PORT"
  if ! curl -sf -o /dev/null "$BASE_URL/sample-invoice"; then
    NEXT_DIST_DIR=.next-invoice npx next dev -p "$PORT" >/dev/null 2>&1 &
    SERVER_PID=$!
    trap '[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true' EXIT
    for _ in $(seq 1 60); do
      curl -sf -o /dev/null "$BASE_URL/sample-invoice" && break
      sleep 1
    done
  fi
fi

# Warm the route so the screenshot doesn't catch a compile.
curl -sf -o /dev/null "$BASE_URL/sample-invoice?shot=1"

# ?shot=1 renders just the 816x1056 page with a 24px white margin, so the
# 864x1104 viewport is exactly the invoice plus margin (no crop needed).
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=864,1104 --force-device-scale-factor=2 \
  --virtual-time-budget=3000 \
  --screenshot="$PWD/$OUT" "$BASE_URL/sample-invoice?shot=1" >/dev/null 2>&1

sips -g pixelWidth -g pixelHeight "$OUT" | tail -2
ls -lh "$OUT" | awk '{print "size:", $5}'
