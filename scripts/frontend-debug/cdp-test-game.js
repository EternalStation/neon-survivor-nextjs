const fs = require('fs');

async function getWsUrl() {
  const resp = await fetch('http://localhost:9222/json');
  const pages = await resp.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  return page?.webSocketDebuggerUrl;
}

function createCDP(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = {};
  const consoleMessages = [];

  const send = (method, params = {}) => {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return msgId;
  };

  function waitForResponse(msgId) {
    return new Promise((resolve) => { pending[msgId] = resolve; });
  }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded') {
      consoleMessages.push({ level: msg.params.message.level, text: msg.params.message.text });
    }
    if (msg.method === 'Log.entryAdded') {
      consoleMessages.push({ level: msg.params.entry.level, text: msg.params.entry.text });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleMessages.push({ level: 'exception', text: msg.params.exceptionDetails.text, desc: msg.params.exceptionDetails.exception?.description });
    }
    if (msg.id && pending[msg.id]) {
      pending[msg.id](msg);
      delete pending[msg.id];
    }
  });

  async function evaluate(expression) {
    const evalId = send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return waitForResponse(evalId);
  }

  async function evaluateValue(expression) {
    const resp = await evaluate(expression);
    return resp.result?.result?.value;
  }

  async function screenshot(name) {
    const ssId = send('Page.captureScreenshot', { format: 'png' });
    const ssResp = await waitForResponse(ssId);
    if (ssResp.result?.data) {
      const path = 'D:/Prog/my/.temp/neon-survivor-nextjs/.temp/' + name;
      fs.writeFileSync(path, Buffer.from(ssResp.result.data, 'base64'));
      console.log('Screenshot saved: ' + path);
    }
  }

  async function waitForText(text, maxWait = 10000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const found = await evaluateValue(`document.body.innerText.includes('${text}')`);
      if (found === true) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  async function clickByText(text, selector = 'button, a, h2, h3, div, span') {
    return evaluateValue(`
      (function() {
        const els = Array.from(document.querySelectorAll('${selector}'));
        const el = els.find(e => e.textContent.trim() === '${text}');
        if (el) { el.click(); return 'clicked: ' + el.tagName; }
        return 'not found';
      })()
    `);
  }

  async function pressKey(code, key, keyCode) {
    send('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode: keyCode });
    await new Promise(r => setTimeout(r, 50));
    send('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: keyCode });
  }

  function getConsoleMessages() { return consoleMessages; }

  function getErrors() { return consoleMessages.filter(m => m.level === 'error' || m.level === 'exception'); }
  function getWarnings() { return consoleMessages.filter(m => m.level === 'warning'); }

  function getPixiMessages() {
    return consoleMessages.filter(m =>
      m.text?.includes('Pixi') || m.text?.includes('pixi') || m.text?.includes('split') ||
      m.text?.includes('Particle') || m.text?.includes('render') || m.text?.includes('shader') ||
      m.text?.includes('WebGL') || m.text?.includes('context') || m.text?.includes('atlas') ||
      m.level === 'exception'
    );
  }

  return {
    ws, send, waitForResponse, evaluate, evaluateValue,
    screenshot, waitForText, clickByText, pressKey,
    getConsoleMessages, getErrors, getWarnings, getPixiMessages,
  };
}

async function run() {
  const wsUrl = await getWsUrl();
  if (!wsUrl) { console.error('No page found at localhost:3000. Make sure Edge is running with --remote-debugging-port=9222'); process.exit(1); }

  const cdp = createCDP(wsUrl);

  await new Promise((resolve) => cdp.ws.addEventListener('open', resolve));
  cdp.send('Runtime.enable');
  cdp.send('Console.enable');
  cdp.send('Log.enable');
  cdp.send('Page.enable');

  console.log('=== STEP 1: Reload page ===');
  cdp.send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 5000));

  console.log('=== STEP 2: Play as Guest ===');
  await cdp.waitForText('Play as Guest', 8000);
  console.log(await cdp.clickByText('Play as Guest (No Leaderboard)', 'button, a'));
  await new Promise(r => setTimeout(r, 2000));

  console.log('=== STEP 3: Enter Void ===');
  await cdp.waitForText('ENTER VOID', 5000);
  console.log(await cdp.clickByText('ENTER VOID', 'button'));
  await new Promise(r => setTimeout(r, 2000));

  console.log('=== STEP 4: Select class (press Enter) ===');
  await cdp.waitForText('SELECT CLASS', 5000);
  await cdp.pressKey('Enter', 'Enter', 13);
  console.log('Waiting 8s for game to load...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n=== SCREENSHOT ===');
  await cdp.screenshot('screenshot-game-test.png');

  console.log('\n=== PAGE STATE ===');
  console.log(await cdp.evaluateValue(`
    JSON.stringify({
      canvasCount: document.querySelectorAll('canvas').length,
      canvasSizes: Array.from(document.querySelectorAll('canvas')).map(c => c.width + 'x' + c.height),
      text: document.body.innerText.substring(0, 400),
    }, null, 2)
  `));

  console.log('\n=== WEBGL STATE ===');
  console.log(await cdp.evaluateValue(`
    (function() {
      const canvases = document.querySelectorAll('canvas');
      const results = [];
      for (const c of canvases) {
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        if (gl && !gl.isContextLost()) {
          const px = new Uint8Array(4);
          gl.readPixels(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
          results.push({ size: c.width+'x'+c.height, lost: false, centerPixel: [px[0], px[1], px[2], px[3]] });
        } else if (gl) {
          results.push({ size: c.width+'x'+c.height, lost: true });
        } else {
          results.push({ size: c.width+'x'+c.height, type: '2d' });
        }
      }
      return JSON.stringify(results, null, 2);
    })()
  `));

  console.log('\n=== PIXI MESSAGES ===');
  const pixiMsgs = cdp.getPixiMessages();
  console.log(pixiMsgs.length ? JSON.stringify(pixiMsgs, null, 2) : 'None');

  console.log('\n=== ERRORS ===');
  const errors = cdp.getErrors();
  console.log(errors.length ? JSON.stringify(errors, null, 2) : 'None');

  console.log('\n=== WARNINGS ===');
  const warnings = cdp.getWarnings();
  console.log(warnings.length ? JSON.stringify(warnings, null, 2) : 'None');

  cdp.ws.close();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
