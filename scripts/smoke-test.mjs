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
const realErrors = (errs) => errs.filter(e => !/favicon|net::ERR|Failed to load resource/i.test(e));

async function trackedPage(ctx) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e));
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

  // settings modal opens and closes
  await page.click('#configBtn');
  await page.waitForSelector('#configModal.open', { timeout: 4000 });
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: true });
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
  let code = 0;
  let browser;
  try {
    await changelogContractPass();
    browser = await chromium.launch();
    await desktopPass(browser);
    await freshProfilePass(browser);
    await mobilePass(browser);
    await welcomePass(browser);
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
    server.close();
  }
  process.exit(code);
})();
