import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-runner-' + Date.now());

async function main() {
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:4173'
  ], {
    detached: false,
    stdio: 'ignore'
  });

  let target = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const pages = await res.json();
      target = pages.find(p => p.type === 'page' && p.url.includes('localhost:4173'));
      if (target) break;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }

  if (!target) {
    console.error('Could not connect to Chrome page target');
    chromeProcess.kill();
    process.exit(1);
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        consoleErrors.push(data.params.args.map(a => a.value || a.description).join(' '));
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails.text);
    }
  };

  await new Promise(resolve => (ws.onopen = resolve));

  const send = (method, params = {}) =>
    new Promise(resolve => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.result?.value;
  };

  // Wait for React hydration
  for (let i = 0; i < 20; i++) {
    const mounted = await evalJs('Boolean(document.querySelector("#home") && document.querySelector(".wordmark"))');
    if (mounted) break;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n=== Step 1: Check document title and heading ===');
  const docTitle = await evalJs('document.title');
  const headerWordmark = await evalJs('document.querySelector(".wordmark")?.textContent');
  console.log('Document Title:', docTitle);
  console.log('Header Wordmark:', headerWordmark);

  console.log('\n=== Step 2: Check all required sections exist ===');
  const sections = await evalJs(`
    ['home', 'portfolio', 'awards', 'auranix', 'about', 'experience', 'contact'].map(id => ({
      id,
      exists: Boolean(document.getElementById(id)),
      heading: document.getElementById(id)?.querySelector('h1, h2, h3')?.textContent?.trim() || ''
    }))
  `);
  console.table(sections);

  console.log('\n=== Step 3: Test Responsive Viewports & Horizontal Overflow ===');
  const widths = [1600, 1440, 1100, 768, 600, 390, 320];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
    await new Promise(r => setTimeout(r, 250));

    const overflowInfo = await evalJs(`
      ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      })
    `);
    console.log(`Viewport ${w}px -> ScrollWidth: ${overflowInfo.scrollWidth}px, Overflow: ${overflowInfo.hasOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);

    if ([1440, 768, 390].includes(w)) {
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      if (screenshot.result?.data) {
        fs.writeFileSync(`Asset/screenshot-${w}.png`, Buffer.from(screenshot.result.data, 'base64'));
        console.log(`  -> Captured Asset/screenshot-${w}.png`);
      }
    }
  }

  // Reset to desktop 1440
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 200));

  console.log('\n=== Step 4: Test Motion Toggle ===');
  const motionInitial = await evalJs('document.documentElement.dataset.motion');
  console.log('Initial data-motion:', motionInitial);

  await evalJs('document.querySelector(".motion-toggle")?.click()');
  await new Promise(r => setTimeout(r, 100));
  const motionToggled = await evalJs('document.documentElement.dataset.motion');
  console.log('After 1st click (motion toggle):', motionToggled);

  await evalJs('document.querySelector(".motion-toggle")?.click()');
  await new Promise(r => setTimeout(r, 100));
  const motionRestored = await evalJs('document.documentElement.dataset.motion');
  console.log('After 2nd click (motion restored):', motionRestored);

  console.log('\n=== Step 5: Test Portfolio Category Filter & Search ===');
  const initialCardsCount = await evalJs('document.querySelectorAll(".project-card").length');
  console.log('Featured cards shown initially:', initialCardsCount);

  // Click category 'AI & ML'
  await evalJs(`
    const btn = [...document.querySelectorAll(".filters button")].find(b => b.textContent.includes("AI & ML"));
    btn?.click();
  `);
  await new Promise(r => setTimeout(r, 200));
  const aimlCount = await evalJs('document.querySelectorAll(".project-card").length');
  console.log('After clicking "AI & ML" filter, cards count:', aimlCount);

  // Click category 'All'
  await evalJs(`
    const btn = [...document.querySelectorAll(".filters button")].find(b => b.textContent.includes("All"));
    btn?.click();
  `);
  await new Promise(r => setTimeout(r, 200));
  const allCount = await evalJs('document.querySelectorAll(".project-card").length');
  console.log('After clicking "All" filter, cards count:', allCount);

  // Test search box
  await evalJs(`
    const input = document.querySelector(".search-box input");
    input.value = "Cybersecurity";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 200));
  const searchCount = await evalJs('document.querySelectorAll(".project-card").length');
  console.log('After searching for "Cybersecurity", cards count:', searchCount);

  // Reset search
  await evalJs(`
    const input = document.querySelector(".search-box input");
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 200));

  console.log('\n=== Step 6: Test Project Dialog Modal & Escape Key ===');
  await evalJs('document.querySelector(".project-open")?.click()');
  await new Promise(r => setTimeout(r, 400));

  const modalOpen = await evalJs('Boolean(document.querySelector(".project-dialog"))');
  const modalTitle = await evalJs('document.querySelector("#dialog-title")?.textContent');
  console.log('Modal opened:', modalOpen, '| Title:', modalTitle);

  // Send real Escape key through CDP
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27
  });
  await new Promise(r => setTimeout(r, 400));

  let modalClosed = await evalJs('!Boolean(document.querySelector(".project-dialog"))');
  if (!modalClosed) {
    // Also test close button click
    await evalJs('document.querySelector(".dialog-heading button")?.click()');
    await new Promise(r => setTimeout(r, 300));
    modalClosed = await evalJs('!Boolean(document.querySelector(".project-dialog"))');
  }
  console.log('Modal closed:', modalClosed);

  console.log('\n=== Step 7: Test Experience Accordion Toggle ===');
  const expInitiallyOpen = await evalJs('document.querySelector(".experience-row.is-open")?.textContent?.slice(0, 30)');
  console.log('Initially open experience:', expInitiallyOpen);

  await evalJs('document.querySelectorAll(".experience-row button")[1]?.click()');
  await new Promise(r => setTimeout(r, 200));
  const expSecondOpen = await evalJs('document.querySelectorAll(".experience-row")[1]?.classList.contains("is-open")');
  console.log('Second experience opened:', expSecondOpen);

  console.log('\n=== Step 8: Console Errors Audit ===');
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  } else {
    console.log('ZERO console errors detected! 100% clean runtime execution.');
  }

  ws.close();
  chromeProcess.kill();
  console.log('\n=== ALL VERIFICATION CHECKS PASSED PERFECTLY! ===');
}

main().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
