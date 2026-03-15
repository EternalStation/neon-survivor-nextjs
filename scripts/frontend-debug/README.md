# CDP Debug Scripts

Debug tools for testing the game via Chrome DevTools Protocol (CDP).
Uses Node.js built-in `WebSocket` and `fetch` (Node 22+). No dependencies needed.

## Setup

Launch Edge with remote debugging:
```bash
bash .temp/launch-edge-debug.sh
# or manually:
msedge --remote-debugging-port=9222 --user-data-dir="$TEMP/edge-debug" --disable-extensions http://localhost:3000
```

## Scripts

### `cdp-test-game.js` — Full game flow test
Reloads page, logs in as guest, navigates to game, takes screenshot, checks WebGL state.
```bash
node .temp/cdp-test-game.js
```

### `cdp-screenshot.js` — Quick screenshot
Takes a screenshot of the current page state.
```bash
node .temp/cdp-screenshot.js                    # saves as screenshot.png
node .temp/cdp-screenshot.js my-screenshot.png  # custom filename
```

### `cdp-eval.js` — Evaluate JS expression
Runs a JS expression in the page and prints the result.
```bash
node .temp/cdp-eval.js "document.title"
node .temp/cdp-eval.js "document.querySelectorAll('canvas').length"
node .temp/cdp-eval.js "JSON.stringify({w: innerWidth, h: innerHeight})"
```

### `cdp-console.js` — Monitor console output
Listens to console messages for a given duration. Optional text filter.
```bash
node .temp/cdp-console.js 10         # listen 10 seconds, all messages
node .temp/cdp-console.js 30 pixi    # listen 30s, filter by "pixi"
node .temp/cdp-console.js 5 error    # listen 5s, filter by "error"
```

### `cdp-debug-render.js` — Debug rendering state
Checks canvas state, WebGL context, CSS overlay stack, and page info.
```bash
node .temp/cdp-debug-render.js
```

## Teardown
```bash
taskkill //F //IM msedge.exe
```
