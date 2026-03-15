const fs = require('fs');

async function run() {
  const resp = await fetch('http://localhost:9222/json');
  const pages = await resp.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) { console.error('No page at localhost:3000'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = {};

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending[msg.id]) {
      pending[msg.id](msg);
      delete pending[msg.id];
    }
  });

  function sendAndWait(method, params = {}) {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return new Promise(resolve => { pending[msgId] = resolve; });
  }

  async function evaluateValue(expression) {
    const resp = await sendAndWait('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return resp.result?.result?.value;
  }

  ws.addEventListener('open', async () => {
    sendAndWait('Runtime.enable');
    await new Promise(r => setTimeout(r, 500));

    console.log('=== CANVAS STATE ===');
    console.log(await evaluateValue(`
      (function() {
        const canvases = document.querySelectorAll('canvas');
        const results = [];
        for (const c of canvases) {
          const gl = c.getContext('webgl2') || c.getContext('webgl');
          let pixelData = null;
          if (gl && !gl.isContextLost()) {
            const px = new Uint8Array(4);
            gl.readPixels(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
            pixelData = { r: px[0], g: px[1], b: px[2], a: px[3] };
          }
          results.push({
            size: c.width + 'x' + c.height,
            hasGL: !!gl,
            isLost: gl ? gl.isContextLost() : null,
            pixelData,
            style: c.style.cssText,
            display: getComputedStyle(c).display,
            parentTag: c.parentElement?.tagName,
          });
        }
        return JSON.stringify(results, null, 2);
      })()
    `));

    console.log('\n=== WEBGL INFO ===');
    console.log(await evaluateValue(`
      (function() {
        const canvas = document.querySelector('canvas');
        if (!canvas) return 'no canvas';
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return 'no GL context';
        if (gl.isContextLost()) return 'CONTEXT LOST (error: ' + gl.getError() + ')';
        return JSON.stringify({
          contextType: gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl',
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          maxTexUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
          drawingBuffer: gl.drawingBufferWidth + 'x' + gl.drawingBufferHeight,
        }, null, 2);
      })()
    `));

    console.log('\n=== CSS OVERLAY STACK (center of screen) ===');
    console.log(await evaluateValue(`
      (function() {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const elements = document.elementsFromPoint(cx, cy);
        return JSON.stringify(elements.map(el => ({
          tag: el.tagName,
          class: (el.className?.substring?.(0, 60) || ''),
          bg: getComputedStyle(el).backgroundColor,
          zIndex: getComputedStyle(el).zIndex,
          position: getComputedStyle(el).position,
        })), null, 2);
      })()
    `));

    console.log('\n=== PAGE INFO ===');
    console.log(await evaluateValue(`
      JSON.stringify({
        title: document.title,
        url: location.href,
        text: document.body.innerText.substring(0, 500),
      }, null, 2)
    `));

    ws.close();
    process.exit(0);
  });

  setTimeout(() => { ws.close(); process.exit(1); }, 15000);
}

run().catch(e => { console.error(e); process.exit(1); });
