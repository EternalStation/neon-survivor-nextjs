#!/bin/bash
# Launch Edge with remote debugging for CDP scripts
# Usage: bash .temp/launch-edge-debug.sh [url]

URL="${1:-http://localhost:3000}"
PORT=9222
PROFILE="$TEMP/edge-debug-profile"

echo "Launching Edge with remote debugging on port $PORT..."
echo "URL: $URL"
echo "Profile: $PROFILE"

"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE" \
  --disable-extensions \
  --no-first-run \
  --disable-default-apps \
  "$URL" &>/dev/null &

sleep 3
echo "Edge launched. Testing connection..."
curl -s http://localhost:$PORT/json | head -5

echo ""
echo "Ready! Run scripts with:"
echo "  node .temp/cdp-test-game.js      # Full game flow test"
echo "  node .temp/cdp-screenshot.js     # Quick screenshot"
echo "  node .temp/cdp-eval.js 'expr'    # Evaluate JS expression"
echo "  node .temp/cdp-console.js 10     # Monitor console for 10s"
echo "  node .temp/cdp-console.js 10 pixi  # Monitor filtered by 'pixi'"
echo "  node .temp/cdp-debug-render.js   # Debug rendering state"
