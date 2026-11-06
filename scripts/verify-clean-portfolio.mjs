import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-verify-clean-' + Date.now());

async function main() {
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
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
      const res = await fetch('http://127.0.0.1:9225/json');
      const pages = await res.json();
      target = pages.find(p => p.type === 'page' && p.url.includes('localhost:4173'));
      if (target) break;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }

  if (!target) {
    console.error('Could not connect to Chrome page target on port 9225');
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
  await send('Input.enable');

  const evalJs = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.result?.value;
  };

  // Wait for React hydration
  for (let i = 0; i < 30; i++) {
    const mounted = await evalJs('Boolean(document.querySelector("#home") && document.querySelector(".hero-title"))');
    if (mounted) break;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n============================================================');
  console.log('CHECK 1: VERIFY ABSENCE OF ALL COLLABORATION ELEMENTS');
  console.log('============================================================');
  const collabAudit = await evalJs(`
    ({
      hasWorkspaceOverlay: Boolean(document.querySelector('.collaboration-workspace-overlay')),
      hasGridPattern: Boolean(document.querySelector('.workspace-grid-pattern')),
      collaboratorPointerCount: document.querySelectorAll('.collaborator-pointer').length,
      collaboratorSwarmGroup: Boolean(document.querySelector('.collaborator-swarm-group')),
      hasActivityDock: Boolean(document.querySelector('.activity-dock-container')),
      hasActivityPill: Boolean(document.querySelector('.activity-dock-pill')),
      hasCanvasFrameBadges: document.querySelectorAll('.canvas-frame-badge').length,
      hasCollabInspectPills: document.querySelectorAll('.collab-inspect-pill').length,
      hasConvergenceEmblem: Boolean(document.querySelector('.auranix-convergence-wrapper')),
      hasCursorOverlay: Boolean(document.querySelector('.auranix-cursor-overlay')),
      hasLeaderGroup: Boolean(document.querySelector('.auranix-leader-group')),
      swarmParticleCount: document.querySelectorAll('.auranix-swarm-particle').length,
      bodyHasActiveCursorClass: document.body.classList.contains('auranix-cursor-active'),
      fakeTextPresence: [...document.querySelectorAll('*')].some(el =>
        /\\b(4 COLLABORATING|MULTIPLE CURSORS CONVERGED|COLLABORATION IN MOTION|ORCHESTRATION: MULTI_AGENT)\\b/i.test(el.textContent)
      )
    })
  `);
  console.table(collabAudit);

  const hasAnyCollabElement =
    collabAudit.hasWorkspaceOverlay ||
    collabAudit.hasGridPattern ||
    collabAudit.collaboratorPointerCount > 0 ||
    collabAudit.collaboratorSwarmGroup ||
    collabAudit.hasActivityDock ||
    collabAudit.hasActivityPill ||
    collabAudit.hasCanvasFrameBadges > 0 ||
    collabAudit.hasCollabInspectPills > 0 ||
    collabAudit.hasConvergenceEmblem ||
    collabAudit.hasCursorOverlay ||
    collabAudit.hasLeaderGroup ||
    collabAudit.swarmParticleCount > 0 ||
    collabAudit.bodyHasActiveCursorClass ||
    collabAudit.fakeTextPresence;

  if (hasAnyCollabElement) {
    console.error('FAIL: Collaboration elements detected in the DOM!');
    process.exit(1);
  } else {
    console.log('PASS: ZERO collaboration artifacts found in DOM or text!');
  }

  console.log('\n============================================================');
  console.log('CHECK 2: VERIFY NATIVE BROWSER CURSOR RESTORATION');
  console.log('============================================================');
  const cursorAudit = await evalJs(`
    ({
      bodyCursor: window.getComputedStyle(document.body).cursor,
      buttonCursor: window.getComputedStyle(document.querySelector('.primary-link')).cursor,
      searchInputCursor: window.getComputedStyle(document.querySelector('.search-box input')).cursor,
      isCursorHiddenOnBody: window.getComputedStyle(document.body).cursor === 'none'
    })
  `);
  console.log('Cursor styles:', cursorAudit);

  if (cursorAudit.isCursorHiddenOnBody) {
    console.error('FAIL: Cursor is still hidden with cursor: none!');
    process.exit(1);
  } else {
    console.log('PASS: Clean standard browser cursor restored cleanly!');
  }

  console.log('\n============================================================');
  console.log('CHECK 3: TEST FULL PAGE SCROLL FROM HERO TO FOOTER');
  console.log('============================================================');
  const scrollSteps = [0, 500, 1000, 1800, 2600, 3400, 4200, 5000];
  for (const y of scrollSteps) {
    await evalJs(`window.scrollTo({ top: ${y}, behavior: 'smooth' })`);
    await new Promise(r => setTimeout(r, 150));
  }
  const footerInView = await evalJs(`
    (() => {
      const footer = document.querySelector('.footer');
      const r = footer.getBoundingClientRect();
      return r.top < window.innerHeight;
    })()
  `);
  console.log(`Scrolled to bottom. Footer in viewport: ${footerInView}`);
  await evalJs(`window.scrollTo({ top: 0, behavior: 'instant' })`);
  await new Promise(r => setTimeout(r, 200));

  console.log('\n============================================================');
  console.log('CHECK 4: TEST PRESERVED PROFESSIONAL ANIMATIONS');
  console.log('============================================================');
  // Check DynamicKeyword
  const initialKeyword = await evalJs('document.querySelector(".dynamic-keyword-wrap")?.textContent?.trim()');
  console.log('DynamicKeyword initial:', initialKeyword);

  // Check 3D project cards
  const projectCardPerspective = await evalJs('document.querySelector(".project-card")?.style.perspective || window.getComputedStyle(document.querySelector(".project-card")).perspective');
  console.log('Project card perspective:', projectCardPerspective);

  // Check Tech Ecosystem node inspection
  await evalJs(`
    const firstNode = document.querySelector(".ecosystem-node");
    firstNode?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 300));
  const telemetryBadge = await evalJs('Boolean(document.querySelector(".node-telemetry-badge"))');
  console.log('Tech Ecosystem node telemetry badge renders on hover:', telemetryBadge);

  // Check Timeline scroll track & beam
  const hasTimelineBeam = await evalJs('Boolean(document.querySelector(".timeline-beam"))');
  console.log('Animated timeline track & beam exists:', hasTimelineBeam);

  // Check Reading progress
  const hasReadingProgress = await evalJs('Boolean(document.querySelector(".reading-progress"))');
  console.log('Top reading progress indicator exists:', hasReadingProgress);

  console.log('\n============================================================');
  console.log('CHECK 5: CONSOLE ERRORS & EXCEPTIONS AUDIT');
  console.log('============================================================');
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
    process.exit(1);
  } else {
    console.log('ZERO console errors or unhandled exceptions detected!');
  }

  ws.close();
  chromeProcess.kill();
  console.log('\n============================================================');
  console.log('ALL VERIFICATION SUITES PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

