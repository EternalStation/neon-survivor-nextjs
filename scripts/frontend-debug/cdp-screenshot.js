const fs = require('fs');

const filename = process.argv[2] || 'screenshot.png';

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

  ws.addEventListener('open', async () => {
    const ssResp = await sendAndWait('Page.captureScreenshot', { format: 'png' });
    if (ssResp.result?.data) {
      const path = 'D:/Prog/my/.temp/neon-survivor-nextjs/.temp/' + filename;
      fs.writeFileSync(path, Buffer.from(ssResp.result.data, 'base64'));
      console.log('Saved: ' + path);
    }
    ws.close();
    process.exit(0);
  });

  setTimeout(() => { ws.close(); process.exit(1); }, 10000);
}

run().catch(e => { console.error(e); process.exit(1); });
