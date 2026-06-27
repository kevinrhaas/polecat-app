# Polecat self-improvement routine

This repo is improved continuously by an **hourly Claude Code routine** — a
saved Claude Code configuration that runs autonomously on Anthropic-managed
cloud infrastructure, even with every laptop closed. It reads
[`ROADMAP.md`](./ROADMAP.md) and ships one focused, non-breaking increment per
run.

This file is the **source of truth for the routine's prompt and setup**. To
change how the loop behaves, edit this file (and/or `ROADMAP.md`) and update the
routine to match.

> Background: [Automate work with routines](https://code.claude.com/docs/en/routines)

---

## How it runs

- A **Routine** with an **hourly schedule trigger** (1 hour is the minimum
  interval; use `/schedule update` for a custom cron).
- Each run is a fresh, fully autonomous cloud session — no permission prompts.
- Manage it at **[claude.ai/code/routines](https://claude.ai/code/routines)**
  (the `/schedule` CLI command is unavailable *inside* a Claude Code on the web
  session — use the web UI there, or `/schedule` from a local terminal).

## Setup (one-time, in the web UI)

1. **New routine** → name it e.g. `Polecat self-improve (hourly)`.
2. **Repositories:** add **both**
   - `kevinrhaas/polecat-app` — the app (app.polecat.live)
   - `kevinrhaas/polecat` — the marketing website (polecat.live)

   Website tasks live in `kevinrhaas/polecat`; both repos must be in scope.
3. **Environment:** the **Default** (Trusted network) is sufficient — the loop
   only needs git/GitHub. The CDN parser libs (pdf.js, JSZip, mammoth, SheetJS)
   load in the *end-user's* browser, not during a run.
4. **Trigger:** Schedule → **Hourly**.
5. **Permissions → branch pushes:** to let the loop *compound* (each run builds
   on the last) and auto-deploy to the live sites, enable **"Allow unrestricted
   branch pushes"** for both repos so it commits to `main`. (Both sites deploy
   from `main` via GitHub Pages.) Leave it off only if you want to review every
   step via PR — but then each run re-clones from `main` and won't see prior
   unmerged work.
6. Paste the prompt below. **Create.** Use **Run now** to test immediately.

## Routine prompt

```
You are the Polecat hourly self-improvement loop, running autonomously.

Repos: kevinrhaas/polecat-app (the app, app.polecat.live) and
kevinrhaas/polecat (the marketing website, polecat.live). The website
tasks live in kevinrhaas/polecat — both repos must be in scope.

Each run, do ONE focused, shippable, non-breaking increment:
1. Read polecat-app/ROADMAP.md — it defines the epics, priorities, and the
   loop's rules and standing directives. Follow them.
2. Advance the single next unchecked step of the highest-priority epic. If
   no epic step can be safely advanced, do a small standalone polish or a
   holistic best-practice/cleanup pass per the ROADMAP. Never regress an
   existing feature.
3. Verify as far as the environment allows: syntax-check changed files,
   boot the app headless for console errors, unit-test pure logic. Be
   honest in the commit/summary about what you could not verify.
4. Tick the box you completed in ROADMAP.md and add a user-facing
   changelog entry (changelog.json in polecat-app; CHANGELOG.md in
   kevinrhaas/polecat for website changes). Each changelog.json entry must
   include a "time" field with the current UTC time (e.g. "14:05 UTC") and
   bump the top-level "updated" + "updatedTime". Keep website + app brand
   and "last updated" stamps in sync.
5. Commit with a clear message and push. Keep each run to ONE increment,
   then stop. Do not open a pull request.

Hold the bar described in the ROADMAP's "North star": world-class, clean,
beginner-friendly, delightful, mobile + desktop, light + dark, no emoji in
the UI (use the existing monochrome SVG icon style).

Cadence — default to shipping features. Most runs advance a real feature.
Roughly every 5 feature runs, spend one run on a best-practice cleanup pass
and one run on a website sync pass (≈5 : 1 : 1). Each run is stateless, so
gauge where you are from history: scan recent git log / changelog and count
feature increments since the last of each pass; if ~5+ have landed since one,
make this run that pass.

Website sync & enhancement pass: audit the app's current, complete feature
set and make the public site (kevinrhaas/polecat, polecat.live) present all
of it accurately and compellingly — refresh screenshots/images of the real
app (use the keyless free demo / a headless render), improve copy, structure,
visuals, SEO and mobile, and keep brand + "last updated" + CHANGELOG.md in
sync. Make the public site the best it can be. One focused commit per run.
```

## Good to know

- **Green run status ≠ task succeeded.** Open a run to confirm what actually
  shipped — blocked network calls and task-level failures surface in the
  transcript, not the status dot.
- Routines draw on a **daily run cap** plus normal subscription usage; see
  [claude.ai/code/routines](https://claude.ai/code/routines).
- Commits and PRs appear as **your** GitHub identity.
