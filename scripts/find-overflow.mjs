import { spawn } from 'child_process';
import path from 'path';

async function findOverflow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-ovf-' + Date.now());
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:4173'
  ]);

  let target = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json');
      const pages = await res.json();
      target = pages.find(p => p.url.includes('4173'));
      if (target) break;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let id = 1;
  const send = (m, params = {}) =>
    new Promise(r => {
      const i = id++;
      const fn = msg => {
        const d = JSON.parse(msg.data);
        if (d.id === i) {
          ws.removeEventListener('message', fn);
          r(d.result);
        }
      };
      ws.addEventListener('message', fn);
      ws.send(JSON.stringify({ id: i, method: m, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
  await new Promise(r => setTimeout(r, 400));

  const res = await send('Runtime.evaluate', {
    expression: `
      [...document.querySelectorAll("*")].map(el => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, id: el.id, class: el.className, right: Math.round(r.right), width: Math.round(r.width) };
      }).filter(x => x.right > 320 && !['HTML', 'BODY', 'root'].includes(x.tag)).slice(0, 15)
    `,
    returnByValue: true
  });

  console.log('Overflowing elements at 320px:', JSON.stringify(res.result.value, null, 2));
  ws.close();
  p.kill();
}

findOverflow().catch(console.error);

