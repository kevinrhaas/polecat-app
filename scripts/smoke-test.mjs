// smoke-test.mjs — the app's smoke gate (fleet contract: run before any merge).
//
// Serves the repo root and drives the real app headless in Chromium at BOTH
// 390×780 (mobile is a release gate) and 1280×800, asserting zero pageerrors
// and that the key flows work: shell frame boots, rail carries the history +
// menu, waffle app-switcher opens, What's-New renders in the right panel,
// theme toggles + persists (including the legacy bare-'light' migration),
// Settings opens, welcome tour shows on a fresh profile, and the mobile
// drawer opens/closes. WebKit runs too when its binary is installed.
//
//   node scripts/smoke-test.mjs
//
// Requires: playwright (chromium). If it isn't resolvable, run e.g.
//   NODE_PATH=$(npm root -g) node scripts/smoke-test.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

// Resolve playwright through require() so NODE_PATH works (a bare ESM import
// ignores it) — lets the gate run against a global install with
//   NODE_PATH=$(npm root -g) node scripts/smoke-test.mjs
import { createRequire } from 'node:module';
let chromium, webkit;
try { ({ chromium, webkit } = createRequire(import.meta.url)('playwright')); }
catch {
  console.error('smoke: playwright not resolvable — try NODE_PATH=$(npm root -g) node scripts/smoke-test.mjs');
  process.exit(1);
}

const ROOT = process.cwd();
const PORT = 4180;
const PORT_OLD = 4181;   // second origin for the cross-origin handoff pass
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

function serve() {
  return http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const data = await readFile(join(ROOT, p.replace(/^\//, '')));
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404); res.end('not found'); }
  });
}

const URL_ = `http://localhost:${PORT}/`;
// Returning-user profile: welcome tour + keys nudge already dismissed, one
// legacy bare theme value to prove the polecat_theme migration.
const seedReturning = () => {
  localStorage.setItem('polecat_welcomed', '1');
  localStorage.setItem('polecat_keys_nudge_shown', '1');
  localStorage.setItem('polecat_theme', 'light');   // pre-shell format
};
// "interactive-widget" is a Chromium-only viewport key (keyboard-resize
// behavior); WebKit logs a console warning for it, which is expected and
// harmless — without the exclusion the WebKit pass false-reds every PR.
const realErrors = (errs) => errs.filter(e => !/favicon|net::ERR|Failed to load resource|Viewport argument key "interactive-widget"/i.test(e));

async function trackedPage(ctx) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e));
  // Stub the CDN scripts (marked/highlight.js) — their latency makes load
  // events flaky in CI and the app degrades gracefully without them, so the
  // gate stays deterministic and runs fully offline.
  await page.route(/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/, r => r.fulfill({
    status: 200,
    contentType: r.request().url().endsWith('.css') ? 'text/css' : 'text/javascript',
    body: '',
  }));
  return { page, errs };
}

async function desktopPass(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, errs } = await trackedPage(ctx);
  await page.addInitScript(seedReturning);
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.ps-rail #sbHistory', { timeout: 12000 });
  await page.waitForSelector('.ps-view .prompt-input', { timeout: 8000 });

  // legacy theme value migrated + stamped before first paint
  const theme = await page.evaluate(() => [
    document.documentElement.getAttribute('data-theme'),
    document.documentElement.getAttribute('data-palette'),
    localStorage.getItem('polecat_theme')]);
  if (theme[0] !== 'light' || theme[1] !== 'polecat' || theme[2] !== 'polecat:light')
    throw new Error(`legacy theme migration broken: ${JSON.stringify(theme)}`);

  // rail is open on desktop and carries the menu footer
  if (!await page.evaluate(() => document.querySelector('.ps-rail')?.classList.contains('open')))
    throw new Error('desktop rail is not open');
  await page.waitForSelector('.ps-rail .sb-foot #sbWhatsNew', { timeout: 4000 });

  // waffle app-switcher lists the fleet
  await page.click('.ps-waffle-btn');
  await page.waitForSelector('.ps-waffle-pop', { timeout: 4000 });
  const apps = await page.evaluate(() => document.querySelectorAll('.ps-waffle-pop .ps-waffle-item').length);
  if (apps < 6) throw new Error(`waffle lists only ${apps} apps`);
  await page.keyboard.press('Escape');

  // What's-New renders the fleet changelog in the right panel + marks seen
  await page.click('#sbWhatsNew');
  await page.waitForSelector('.ps-rpanel.in .wn-entry', { timeout: 5000 });
  const seen = await page.evaluate(() => localStorage.getItem('polecat_changelog_seen'));
  if (!seen || !/^\d+$/.test(seen)) throw new Error(`what's-new did not mark seen version (got ${JSON.stringify(seen)})`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);

  // theme toggle flips + persists in the shell format
  await page.click('#sbTheme');
  await page.waitForTimeout(250);
  const t2 = await page.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('polecat_theme')]);
  if (t2[0] !== 'dark' || t2[1] !== 'polecat:dark') throw new Error(`theme toggle broken: ${JSON.stringify(t2)}`);

  // settings modal opens and closes; every provider (incl. Kimi) offers a key field
  await page.click('#configBtn');
  await page.waitForSelector('#configModal.open', { timeout: 4000 });
  const keyProviders = await page.evaluate(() => document.getElementById('keyFields')?.textContent || '');
  for (const p of ['Claude', 'Gemini', 'ChatGPT', 'Kimi', 'OpenRouter', 'Groq', 'Hugging Face'])
    if (!keyProviders.includes(p)) throw new Error(`settings: ${p} key field missing`);
  await page.click('#doneConfig');
  await page.waitForTimeout(250);

  const real = realErrors(errs);
  if (real.length) throw new Error('desktop errors:\n  ' + real.join('\n  '));
  await ctx.close();
  console.log('✓ desktop (1280×800): frame, rail, waffle, what\'s-new, theme migration + toggle, settings — no errors');
}

async function freshProfilePass(browser) {
  // A brand-new visitor must still get the welcome tour over the shell frame.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, errs } = await trackedPage(ctx);
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.welcome-overlay.open', { timeout: 8000 });
  await page.evaluate(() => document.getElementById('wClose')?.click());
  await page.waitForTimeout(700);   // dismissing may auto-open Settings→Keys (expected)
  const real = realErrors(errs);
  if (real.length) throw new Error('fresh-profile errors:\n  ' + real.join('\n  '));
  await ctx.close();
  console.log('✓ fresh profile: welcome tour renders over the shell frame — no errors');
}

async function mobilePass(browser) {
  // hasTouch makes (pointer: coarse) match — required for the ≥16px input check
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
  const { page, errs } = await trackedPage(ctx);
  await page.addInitScript(seedReturning);
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.ps-view .prompt-input', { timeout: 12000 });

  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
    throw new Error('mobile: page overflows horizontally at 390px');
  if (await page.evaluate(() => {
    const last = [...document.querySelectorAll('.ps-topbar > *')].pop();
    return last ? last.getBoundingClientRect().right > innerWidth + 1 : true;
  })) throw new Error('mobile: topbar overflows the 390px viewport');

  // a long draft must never push the send button off-screen (the iOS bug:
  // the composer grew unbounded and the send row fell below the viewport)
  await page.evaluate(() => {
    const inp = document.getElementById('promptInput');
    inp.value = 'long draft line\n'.repeat(40);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const send = await page.evaluate(() => {
    const r = document.getElementById('sendBtn')?.getBoundingClientRect();
    return r ? { top: r.top, bottom: r.bottom, right: r.right } : null;
  });
  if (!send) throw new Error('mobile: send button missing');
  if (send.bottom > 780 + 1 || send.top < 0 || send.right > 390 + 1)
    throw new Error(`mobile: send button off-screen with a long draft (${JSON.stringify(send)})`);
  // composer input must be ≥16px on touch — anything smaller makes iOS
  // auto-zoom the page on focus (the "everything is huge / pinch to find
  // send" report). Chromium at 390px with a coarse-pointer context applies
  // the same media query Safari would.
  const fs = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('promptInput')).fontSize));
  if (fs < 16) throw new Error(`mobile: composer font-size ${fs}px < 16px — iOS will auto-zoom on focus`);
  await page.evaluate(() => {
    const inp = document.getElementById('promptInput');
    inp.value = '';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // drawer: boots closed, hamburger opens it, backdrop closes it
  if (await page.evaluate(() => document.querySelector('.ps-rail')?.classList.contains('open')))
    throw new Error('mobile: drawer must boot closed');
  await page.click('.ps-topbar-menu');
  await page.waitForTimeout(350);
  if (!await page.evaluate(() => document.querySelector('.ps-rail')?.classList.contains('open')))
    throw new Error('mobile: hamburger did not open the drawer');
  await page.waitForSelector('.ps-rail .sb-foot #configBtn', { timeout: 4000 });
  await page.evaluate(() => document.querySelector('.ps-rail-backdrop')?.click());
  await page.waitForTimeout(350);
  if (await page.evaluate(() => document.querySelector('.ps-rail')?.classList.contains('open')))
    throw new Error('mobile: backdrop did not close the drawer');

  const real = realErrors(errs);
  if (real.length) throw new Error('mobile errors:\n  ' + real.join('\n  '));
  await ctx.close();
  console.log('✓ mobile (390×780): fits, drawer opens/closes, composer present — no errors');
}

async function welcomePass(browser) {
  // The chat marketing page at /welcome/ (folded in from the old polecat repo).
  for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 780 }]) {
    const ctx = await browser.newContext({ viewport: vp });
    const { page, errs } = await trackedPage(ctx);
    await page.goto(URL_ + 'welcome/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('.hero h1', { timeout: 8000 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1))
      throw new Error(`welcome: page overflows horizontally at ${vp.width}px`);
    const real = realErrors(errs);
    if (real.length) throw new Error(`welcome ${vp.width}px errors:\n  ` + real.join('\n  '));
    await ctx.close();
  }
  console.log('✓ welcome page (/welcome/): renders at desktop + 390px — no errors');
}

async function handoffPass(browser) {
  // The origin-handoff path (DOMAINS.md step 1): the "we moved" stub on one
  // origin (127.0.0.1:PORT_OLD) packs seeded data into #handoff= and forwards
  // to the app on another origin (localhost:PORT), which imports it after an
  // explicit confirm. localStorage does not cross these origins, so this
  // exercises the real thing.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, errs } = await trackedPage(ctx);
  page.on('dialog', d => d.accept());
  await page.addInitScript(([oldPort]) => {
    if (location.port === String(oldPort)) {          // the OLD origin only
      localStorage.setItem('polecat', JSON.stringify({
        schemaVersion: 1,
        providers: { groq: { key: 'gsk_smoke_handoff_key' } },
        selections: [{ id: 's1', provider: 'groq', model: 'llama-3.3-70b-versatile' }],
        arbitration: { activeId: 'comprehensive', arbiter: 'auto', custom: [] },
        consensus: true, systemPrompt: 'be brief',
      }));
      localStorage.setItem('polecat_history', JSON.stringify([
        { id: 't1', title: 'Moved conversation', updatedAt: 1752600000000, turns: [] }]));
      localStorage.setItem('polecat_theme', 'polecat:light');
      localStorage.setItem('polecat_changelog_seen', '134');
    } else {                                          // fresh destination, tour dismissed
      localStorage.setItem('polecat_welcomed', '1');
      localStorage.setItem('polecat_keys_nudge_shown', '1');
    }
  }, [PORT_OLD]);
  await page.goto(`http://127.0.0.1:${PORT_OLD}/handoff-stub/?to=${encodeURIComponent(`http://localhost:${PORT}/`)}`,
    { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForURL(u => u.hostname === 'localhost' && u.port === String(PORT), { timeout: 15000, waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ps-rail #sbHistory', { timeout: 12000 });
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => {
    const cfg = JSON.parse(localStorage.getItem('polecat') || '{}');
    return {
      hash: location.hash,
      key: cfg?.providers?.groq?.key || '',
      sys: cfg?.systemPrompt || '',
      titles: (JSON.parse(localStorage.getItem('polecat_history') || '[]')).map(t => t.title),
      theme: document.documentElement.getAttribute('data-theme'),
      storedTheme: localStorage.getItem('polecat_theme'),
      listed: !!document.querySelector('#sbHistory .sb-item'),
    };
  });
  if (st.key !== 'gsk_smoke_handoff_key') throw new Error('handoff: API key did not arrive');
  if (st.sys !== 'be brief') throw new Error('handoff: systemPrompt did not arrive');
  if (!st.titles.includes('Moved conversation')) throw new Error('handoff: history did not arrive');
  if (!st.listed) throw new Error('handoff: history did not render in the rail');
  if (st.theme !== 'light' || st.storedTheme !== 'polecat:light') throw new Error(`handoff: theme did not carry over (${st.theme}, ${st.storedTheme})`);
  if (st.hash) throw new Error(`handoff: fragment not stripped after import (${st.hash.slice(0, 40)}…)`);
  const real = realErrors(errs);
  if (real.length) throw new Error('handoff errors:\n  ' + real.join('\n  '));
  await ctx.close();

  // Declining the confirm must import NOTHING.
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page: p3, errs: e3 } = await trackedPage(ctx2);
  p3.on('dialog', d => d.dismiss());
  await p3.addInitScript(([oldPort]) => {
    if (location.port === String(oldPort)) {
      localStorage.setItem('polecat', JSON.stringify({ schemaVersion: 1, providers: { groq: { key: 'gsk_decline_key' } }, selections: [], arbitration: { activeId: 'comprehensive', arbiter: 'auto', custom: [] } }));
    } else {
      localStorage.setItem('polecat_welcomed', '1');
      localStorage.setItem('polecat_keys_nudge_shown', '1');
    }
  }, [PORT_OLD]);
  await p3.goto(`http://127.0.0.1:${PORT_OLD}/handoff-stub/?to=${encodeURIComponent(`http://localhost:${PORT}/`)}`,
    { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p3.waitForURL(u => u.hostname === 'localhost' && u.port === String(PORT), { timeout: 15000, waitUntil: 'domcontentloaded' });
  await p3.waitForSelector('.ps-view .prompt-input', { timeout: 12000 });
  await p3.waitForTimeout(700);
  const declined = await p3.evaluate(() => ({
    key: JSON.parse(localStorage.getItem('polecat') || '{}')?.providers?.groq?.key || '',
    hash: location.hash,
  }));
  if (declined.key) throw new Error('handoff: declining the confirm still imported the key');
  if (declined.hash) throw new Error('handoff: fragment not stripped after decline');
  const real3 = realErrors(e3);
  if (real3.length) throw new Error('handoff decline errors:\n  ' + real3.join('\n  '));
  await ctx2.close();
  console.log('✓ origin handoff: data crosses origins only via #handoff=, confirm-gated, fragment stripped; decline imports nothing');
}

async function degradedConsensusPass(browser) {
  // A real consensus run where one of two models fails: the answer + follow-ups
  // must render, and with the agreement map ON the app must EXPLAIN the missing
  // map (.prov-gap-note) instead of silently dropping it (field report
  // 2026-07-18). The demo worker is mocked in-page, so this is deterministic.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, errs } = await trackedPage(ctx);
  await page.addInitScript(() => {
    localStorage.setItem('polecat_welcomed', '1');
    localStorage.setItem('polecat_keys_nudge_shown', '1');
    localStorage.setItem('polecat', JSON.stringify({
      schemaVersion: 1, providers: {}, consensus: true,
      selections: [
        { id: 'sA', provider: 'demo', model: 'mock/model-a' },
        { id: 'sB', provider: 'demo', model: 'mock/model-b' },
      ],
      arbitration: { activeId: 'sequential', arbiter: 'auto', provenance: true, custom: [] },
    }));
  });
  await page.route(/workers\.dev/, route => {
    const body = route.request().postDataJSON?.() || {};
    if ((body.model || '').includes('model-a')) {
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'mock outage' } }) });
    }
    const sse = [
      'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Mock answer from model B.' } }] }),
      'data: [DONE]', '',
    ].join('\n\n');
    return route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse });
  });
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.ps-view .prompt-input', { timeout: 12000 });
  await page.evaluate(() => {
    const inp = document.getElementById('promptInput');
    inp.value = 'Smoke: degraded consensus run';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('sendBtn').click();
  });
  await page.waitForSelector('#conv_consensus .qa-pair .msg-bubble', { timeout: 20000 });
  await page.waitForSelector('.prov-gap-note', { timeout: 15000 });
  const st = await page.evaluate(() => ({
    note: document.querySelector('.prov-gap-note')?.textContent || '',
    consensus: document.querySelector('#conv_consensus .qa-pair:last-child .msg.assistant .msg-bubble')?.textContent || '',
    map: !!document.querySelector('.provenance-panel'),
  }));
  if (!/only one model answered/i.test(st.note)) throw new Error(`degraded consensus: gap note wrong: "${st.note}"`);
  if (!st.consensus.includes('Mock answer from model B')) throw new Error('degraded consensus: consensus text missing');
  if (st.map) throw new Error('degraded consensus: a map rendered where none should');
  const real = realErrors(errs);
  if (real.length) throw new Error('degraded consensus errors:\n  ' + real.join('\n  '));
  await ctx.close();
  console.log('✓ degraded consensus: one model fails → answer renders + missing agreement map is explained');
}

async function kimiProviderPass(browser) {
  // The Kimi (Moonshot AI) provider end-to-end against a mocked api.moonshot.ai:
  // the request must hit the right base URL with the user's bearer key, both
  // models answer, a consensus renders, and the agreement map appears (two
  // answers → the map must be back).
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page, errs } = await trackedPage(ctx);
  const seen = { auth: '', urls: [] };
  await page.route(/api\.moonshot\.ai/, route => {
    seen.auth = route.request().headers()['authorization'] || '';
    seen.urls.push(route.request().url());
    const body = route.request().postDataJSON?.() || {};
    const who = (body.model || '').includes('k2.6') ? 'Kimi B says beta.' : 'Kimi A says alpha.';
    const sse = ['data: ' + JSON.stringify({ choices: [{ delta: { content: who } }] }), 'data: [DONE]', ''].join('\n\n');
    return route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse });
  });
  await page.addInitScript(() => {
    localStorage.setItem('polecat_welcomed', '1');
    localStorage.setItem('polecat_keys_nudge_shown', '1');
    localStorage.setItem('polecat', JSON.stringify({
      schemaVersion: 1, consensus: true,
      providers: { kimi: { key: 'sk-smoke-kimi' } },
      selections: [
        { id: 'k1', provider: 'kimi', model: 'kimi-k3' },
        { id: 'k2', provider: 'kimi', model: 'kimi-k2.6' },
      ],
      arbitration: { activeId: 'comprehensive', arbiter: 'auto', provenance: true, custom: [] },
    }));
  });
  await page.goto(URL_, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('.ps-view .prompt-input', { timeout: 12000 });
  await page.evaluate(() => {
    const inp = document.getElementById('promptInput');
    inp.value = 'Smoke: kimi provider run';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('sendBtn').click();
  });
  await page.waitForSelector('#conv_consensus .qa-pair .msg.assistant .msg-bubble', { timeout: 20000 });
  await page.waitForSelector('.provenance-panel', { timeout: 15000 });
  const st = await page.evaluate(() => ({
    consensus: document.querySelector('#conv_consensus .qa-pair:last-child .msg.assistant .msg-bubble')?.textContent || '',
    map: !!document.querySelector('.provenance-panel'),
    gapNote: !!document.querySelector('.prov-gap-note'),
  }));
  if (seen.auth !== 'Bearer sk-smoke-kimi') throw new Error(`kimi: wrong/missing bearer key (${seen.auth})`);
  if (!seen.urls.every(u => u.includes('api.moonshot.ai/v1'))) throw new Error('kimi: request left the moonshot base URL');
  if (!st.consensus.trim()) throw new Error('kimi: consensus missing');
  if (!st.map) throw new Error('kimi: agreement map missing with two successful answers');
  if (st.gapNote) throw new Error('kimi: gap note rendered although the map ran');
  const real = realErrors(errs);
  if (real.length) throw new Error('kimi errors:\n  ' + real.join('\n  '));
  await ctx.close();
  console.log('✓ kimi provider: mocked api.moonshot.ai round-trip — bearer key, consensus, agreement map');
}

async function changelogContractPass() {
  const mod = await import(join(ROOT, 'js', 'changelog.js'));
  if (!Array.isArray(mod.CHANGELOG) || !mod.CHANGELOG.length) throw new Error('changelog: CHANGELOG missing/empty');
  if (typeof mod.LATEST_VERSION !== 'number' || mod.LATEST_VERSION !== mod.CHANGELOG[0].v)
    throw new Error('changelog: LATEST_VERSION must equal CHANGELOG[0].v');
  console.log(`✓ changelog contract: ${mod.CHANGELOG.length} entries, latest v${mod.LATEST_VERSION}`);
}

(async () => {
  const server = serve();
  await new Promise(r => server.listen(PORT, r));
  const serverOld = serve();
  await new Promise(r => serverOld.listen(PORT_OLD, r));
  let code = 0;
  let browser;
  try {
    await changelogContractPass();
    browser = await chromium.launch();
    await desktopPass(browser);
    await freshProfilePass(browser);
    await mobilePass(browser);
    await welcomePass(browser);
    await handoffPass(browser);
    await degradedConsensusPass(browser);
    await kimiProviderPass(browser);
    await browser.close(); browser = null;

    // WebKit (iOS engine) — best-effort: run when the binary exists.
    try {
      const wk = await webkit.launch();
      try {
        await desktopPass(wk);
        await mobilePass(wk);
        console.log('✓ WebKit pass');
      } finally { await wk.close(); }
    } catch (e) {
      if (/Executable doesn't exist|browserType.launch/.test(String(e))) console.log('· WebKit not installed — skipped');
      else throw e;
    }
    console.log('\n✅ smoke test passed');
  } catch (e) {
    console.error('\n❌ smoke test FAILED:\n' + e.message);
    code = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close(); serverOld.close();
  }
  process.exit(code);
})();
