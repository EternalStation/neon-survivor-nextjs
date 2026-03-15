const duration = parseInt(process.argv[2] || '10', 10) * 1000;
const filter = process.argv[3] || '';

async function run() {
  const resp = await fetch('http://localhost:9222/json');
  const pages = await resp.json();
  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) { console.error('No page at localhost:3000'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    let entry = null;

    if (msg.method === 'Console.messageAdded') {
      entry = { level: msg.params.message.level, text: msg.params.message.text };
    }
    if (msg.method === 'Log.entryAdded') {
      entry = { level: msg.params.entry.level, text: msg.params.entry.text };
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      entry = { level: 'EXCEPTION', text: msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text };
    }

    if (entry) {
      if (filter && !entry.text?.toLowerCase().includes(filter.toLowerCase())) return;
      const prefix = entry.level === 'error' || entry.level === 'EXCEPTION' ? '\x1b[31m' :
                     entry.level === 'warning' ? '\x1b[33m' :
                     entry.level === 'info' ? '\x1b[36m' : '';
      const reset = prefix ? '\x1b[0m' : '';
      console.log(`${prefix}[${entry.level}]${reset} ${entry.text}`);
    }
  });

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ id: id++, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: id++, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: id++, method: 'Log.enable' }));
    console.log(`Listening for ${duration / 1000}s...` + (filter ? ` (filter: "${filter}")` : ''));
  });

  setTimeout(() => { ws.close(); process.exit(0); }, duration);
}

run().catch(e => { console.error(e); process.exit(1); });
