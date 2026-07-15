# polecat-app (app.polecat.live) — agent guide

Polecat Chat, the consensus-chat flagship: one prompt to many AI models at
once, one synthesized answer. Vanilla HTML/JS/CSS single-page app (no
framework, no build step, ES modules) on GitHub Pages. Installable PWA
(`manifest.webmanifest`; no service worker yet — nothing to cache-bump).
Read **kevinrhaas/polecat-platform → docs/FLEET-GUIDE.md** first for how work
ships fleet-wide; `ROADMAP.md` here for direction.

## The vendored shell is READ-ONLY

`vendor/polecat-shell/` is a versioned verbatim copy of `lib/` from
**kevinrhaas/polecat-platform** (see its docs/SHELL-API.md). **Never edit
files under `vendor/polecat-shell/`** — changes belong in the platform repo
and arrive via `chore: polecat-shell vX.Y.Z` sync PRs (MANIFEST.json sha256
hashes are drift-checked by fleet sweeps).

How the app sits on the shell:
- `js/app.js buildFrame()` owns the wiring: `initShell` (the rail carries the
  chat furniture — New chat, search, history, menu footer — as pinned
  app-owned nodes, not section nav), `appSwitcher(publicFleet())`, and
  What's-New via `rightPanel` + `initWhatsNew`.
- Theming keeps the historical key via `configure({ storageKey:
  'polecat_theme' })`. The stored value migrated from bare `'dark'`/`'light'`
  to the shell's `'palette:mode'`; the index.html pre-paint snippet normalizes
  legacy values — do not remove it.
- `js/ui.js` keeps the app's pre-shell helper signatures (`$` by id,
  `el(tag, cls, html)`) — a wholesale swap to the vendored ui.js is a
  shell-v2 candidate, same call Manager made.
- App skinning over the shell lives at the END of `css/styles.css`
  ("Polecat Shell integration" section). The desktop rail is always open
  (a history rail has no icon-only mode); mobile gets the shell drawer.

## Sacred invariants (do not break)

- **100% client-side BYOK**: API keys live in `localStorage` only and are
  sent only to each provider (or the user's configured proxy) — never to us.
- **Storage keys are forever**: `polecat` (config, schema-versioned additive
  migrations in `js/config.js`), `polecat_history`, `polecat_theme`. Never
  wipe or lose chat history or keys on upgrade.
- **The free-demo proxy contract** (`proxy/worker.js`, Cloudflare Worker):
  the keyless `demo` provider calls it; its key lives server-side.
- **PWA installability** (manifest + icons) — the durable-storage story on
  iOS depends on it.
- **Changelog pipeline**: edit `changelog.json` (newest first, real CT
  timestamps — nothing stamps post-merge), then `node
  scripts/gen-changelog.mjs` regenerates `js/changelog.js` (fleet format;
  Manager + the polecat.live launcher parse it live). Never hand-edit
  `js/changelog.js`; never break its parseability.

## Gates before any merge

- `node scripts/validate.mjs` — ES-module parse + smart-quote guard (CI runs
  this on every push/PR).
- `node scripts/smoke-test.mjs` — Playwright smoke: desktop AND 390×780,
  fresh + returning profiles, zero pageerrors. Mobile is a release gate.
  (Global playwright: `NODE_PATH=$(npm root -g) node scripts/smoke-test.mjs`.)
- Ship via `steward/<topic>` (or session) branch + PR; merge is ship
  (Pages deploys main; `auto-revert.yml` guards it). Never push to main.
- No model identifiers in repo artifacts.

## Domain note (GATED)

app.polecat.live → chat.polecat.live is a planned rename that MUST NOT run
without Kevin's explicit written go — see polecat-platform docs/DOMAINS.md.
Installed PWAs pin to their origin and localStorage does not cross origins:
export/handoff ships and is verified BEFORE any DNS/Pages-domain change.
