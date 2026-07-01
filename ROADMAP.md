# Polecat roadmap

The hourly self-improve loop reads this file. When an epic has unchecked steps,
the loop advances the **next unchecked step of the highest-priority epic** as a
real, shippable, non-breaking increment — then ticks the box and adds a
`changelog.json` entry. Small standalone polish is the fallback when no epic step
can be safely advanced.

## 🔝 DO THIS NEXT (operator priority, set 2026-06-30) — ahead of ALL epics

Work these in order, one shippable step per run:

1. **Make Polecat installable (PWA) + data durability — DONE (shipped 2026-06-30):** web app
   manifest + `apple-mobile-web-app-*` meta tags landed, so the app is installable (Home Screen
   / Chrome install) — the durable fix for iOS storage eviction. (`navigator.storage.persist()`
   was already wired.) NEXT: the easier-backup nudge (see "One-tap backup nudge" in the Data
   durability backlog section below).
2. **Models screen: ordering, visible roles, arbiter-only models** — DONE (shipped 2026-06-30:
   reorder, set Arbiter, synthesis-only mode). Leaving here for context.
3. **Rethink the Models + Consensus screens** so the "N models answer → 1 arbitrates →
   consensus" flow is obvious at a glance (show the answering set on the Consensus tab,
   a small visual flow, less jargon, tightly link the two tabs). — STEP 1 DONE (shipped
   2026-07-01): the Consensus tab now opens with a small pill flow — [answering models]
   → [arbiter] → [Consensus] — plus a plain-language sentence ("Your 3 models answer in
   parallel, then Claude · Opus 4.1 merges them into one answer.") and a "Manage models →"
   link into the Models tab; the Models tab gained a reciprocal "Arbiter & consensus
   strategy are set in the Consensus tab →" link. Degrades gracefully to a "No models are
   set to answer yet" hint when nothing is selected. STEP 2 DONE (2026-06-30): while
   testing the arbiter-only badge, found and fixed a real bug the pill flow exposed —
   changing the arbiter (Models tab "Arbiter" button, or the Consensus tab dropdown) left
   a stale `arbiterOnly` flag on the PREVIOUS arbiter, silently excluding it from answering
   forever with no visible indicator anywhere (the "Synthesis only" checkbox only renders
   for the current arbiter row, so there was no way to even see or undo it). `setArbiter()`
   now clears `arbiterOnly` on the outgoing arbiter and refreshes the composer chips, so
   "who answers" is always visibly accurate — the actual precondition for any further
   badge/jargon unification work. NEXT: consider whether the two tabs should be more
   tightly unified (e.g. surfacing arbiter-only badges consistently, or further reducing
   "arbiter/strategy" jargon) per the full backlog item below.

These are one theme — lead with them. They span several runs, so on any run where
you can't advance them safely, pick up the next **operator-requested** item below
(the small high-value bug-fixes/polish — conflicting counts, Keys-tab status, image
hint, etc.) so the queue keeps flowing. Once these two are done, work the
operator-requested backlog top-to-bottom, then resume the regular epics.

---

## North star & standing directives (apply judgement EVERY run)

Polecat should be **world-class and visibly ahead of every competitor** — a
simple joy to use: clean, elegant, beginner-friendly, fun, delightful, and
genuinely innovative. Hold this bar on every change. Concretely:

- **Beginner-first & guided.** Sensible defaults, gentle inline helpers/tooltips,
  empty states that teach, no jargon. A first-timer should succeed in seconds.
- **Clean, elegant information architecture.** Keep menus/settings well-organised
  and uncluttered. It's OK — encouraged — to *reorganise, group, rename, or move*
  controls when it makes things simpler and more obvious.
- **Delight & polish.** Beautiful spacing/typography, tasteful motion, responsive
  and flawless on desktop AND mobile, light AND dark.
- **Lean into the differentiator.** The multi-model + consensus/arbitration story
  is the magic — make it effortless, legible, and impressive.
- **No emoji in the UI.** Use ONE consistent set of simple, modern, monochrome
  SVG icons (match the existing header stroke-icon style: 24×24, `currentColor`,
  ~2px stroke). Never add new emoji; replace existing emoji with proper icons as
  you touch each area. (Emoji in model/provider data labels are fine to keep.)
- **Innovate forward, don't thrash.** Press toward groundbreaking, genuinely new
  capability — but evolve, don't wildly rewrite. Never regress existing features.

**Periodic best-practice pass (do this every few runs, by your own judgement):**
instead of a feature, step back and do a holistic cleanup/reorganisation —
audit the menus/settings/onboarding, simplify and de-clutter, fix inconsistencies,
improve accessibility & mobile, tighten copy, and raise the overall craft. Treat
it as ongoing curation so the app keeps getting *simpler* as it gets more capable.

---

## EPIC 1 — Consensus provenance & agreement map  ⭐ (highest priority)

**Vision:** make the cross-model advantage *visible*. For each consensus answer,
show where it came from: how much each model contributed (approx), where the
models agreed vs disagreed, and which claims are notable or contested. This is
Polecat's signature differentiator vs single-model chat (Gemini/Claude).

**Principles**
- Never block or slow the streamed consensus answer — provenance is computed/
  shown *after* the answer, and degrades gracefully if unavailable.
- Be honest: contribution percentages are **approximate**; label them so. Prefer
  the arbiter's grounded analysis of the actual answers over hand-wavy guesses.
- Don't fabricate attribution. If confidence is low, say "mixed / unclear".
- Works with any model count; no-ops cleanly for a single model.
- Accessible: never color-only — pair color with labels/text.

**Phases** (do roughly one per run; keep each a single focused commit)
- [x] **P1 — Provenance data from the arbiter.** Add an `arbitration.js` step that,
      after the consensus answer is produced, makes ONE extra silent arbiter call
      returning machine-readable JSON: `{ perModel:[{id,label,contributionPct,
      stance}], agreements:[...], disagreements:[{point, positions:[{model,
      claim}]}], notable:[{claim, models, note}] }`. Parse robustly (tolerate
      fenced ```json, extra prose, or failure → null). Expose it to app.js via the
      arbitration ctx without changing the streamed answer. Gate behind a setting
      (default on) so it can be disabled.
- [x] **P2 — Local agreement signal (no extra cost).** In a small helper, compute
      pairwise similarity among the raw model answers (token/shingle Jaccard) and
      a rough per-model overlap with the final consensus text. Use as a fallback
      when the arbiter JSON is missing, and to cross-check its percentages.
- [x] **P3 — Provenance panel UI.** Below the consensus answer, add a collapsible
      "How this was formed" panel: per-model contribution bars (%, approx),
      a one-line agreement summary, and expandable "Where they disagreed" and
      "Notable claims" sections. Use each model's brand color + a text label.
      Mobile-friendly, accessible.
- [x] **P4 — Inline attribution.** Optionally color/annotate sentences or sections
      of the consensus answer by originating model and/or agreement level, with a
      hover/tap tooltip ("Claude & Gemini agreed", "only GPT-5 claimed this").
      A toggle turns highlighting on/off. Must stay readable when off.
- [x] **P5 — Polish.** Performance, graceful degradation (1 model, missing data,
      arbiter failure), reduced-motion, light/dark, and a short "What's new" +
      a one-line note on the public website explaining the agreement map.

**Done when:** a typical multi-model consensus shows an accurate, honest, and
beautiful breakdown of contribution + agreement/disagreement, on desktop and
mobile, with zero impact on time-to-first-answer.

---

## EPIC 2 — Files & documents as attachments  ⭐⭐ (operator-requested, high priority)

**Vision:** let users attach not just images but **documents** — PPTX, PDF, DOCX,
XLSX, CSV, TXT, MD, code, JSON — and analyze them across models. Everything stays
**100% in the browser** (no server): text is extracted client-side, matching
Polecat's privacy promise. (PPTX was the operator's concrete blocker — prioritize it.)

**Principles**
- Up to **5 attachments**; per-file size cap (~10MB) + a sensible total cap. Clear,
  friendly errors for unsupported types / too-large files.
- **Extract text client-side** and inject it as a labelled context block so EVERY
  model can use it (including free text-only models). Images keep the native vision path.
- **Lazy-load** parser libraries from CDN only when a matching file is attached
  (keep the app light); guard for offline/CDN-blocked.
- Truncate very large extractions to a token budget with a visible "(truncated)"
  note; mind free-demo/context limits.
- Graceful degradation: if a type can't be parsed, attach the filename + a note.
- **REQUIRED (treat absence as a bug, not polish):** always show a clear per-file
  **progress / processing indicator** while extracting text locally — a spinner or
  progress meter on each file chip and a disabled/“working…” send state — so the UI
  never appears frozen. Build this *with each parser phase* (F1–F4), not in F6.

**Phases** (one per run; keep each a single focused commit)
- [x] **F1 — Generalize attachments from images-only to any file.** Picker accepts
      docs + images; drag/drop/paste; ≤5 files; size caps; file chips with a type
      icon + name + size + remove. Plain-text family (txt, md, csv, json, code, log)
      is read and injected as text immediately.
- [x] **F2 — PDF text extraction** via pdf.js (lazy CDN); inject text with light page
      markers; cap length.
- [x] **F3 — Office docs** (PPTX first, then DOCX, XLSX) via in-browser unzip
      (JSZip) / mammoth / SheetJS — extract slide/sheet/doc text.
- [x] **F4 — Prompt injection & budgeting.** Fold extracted content into the message
      as labelled blocks ("Attached: deck.pptx" + text), shared across all selected
      models; token-budget + truncation notice; works with consensus/arbitration.
- [x] **F5 — Native document passing — APPROVED (operator said yes to native PDF).**
      For capable providers, pass the document natively instead of extracted text:
      Anthropic PDF document blocks, Gemini inline_data application/pdf, OpenAI file
      input. **Prioritize native PDF for Claude/Gemini/GPT** (higher fidelity); keep
      client-side text extraction as the universal fallback for models that can't.
- [x] **F6 — Polish.** Refine error states, mobile, a11y, a privacy note ("files are
      read in your browser, never uploaded"), and "What's new". (Progress indicator
      is NOT here — it's a core requirement built in F1–F4.)

**Decided:** extract-text-for-all is the universal baseline; **native PDF passing to
capable models (Claude/Gemini/GPT) is approved** (F5) — do it for those models and
fall back to text extraction elsewhere.

**Done when:** a user can attach a PPTX (and PDF/DOCX/XLSX/text) and ask all models
to analyze it, fully client-side, with clean limits and clear feedback.

---

## EPIC 3 — Settings & icon-system refresh  ⭐ (next after EPIC 1)

Make the chrome (settings, sidebar, overlays) sleek, modern, simpler and less
confusing, with a consistent icon language and zero emoji.

- [x] **Fix the settings blur-on-open bug** — the modal rendered blurred until a
      click; moved `backdrop-filter` to a `::before` layer so the panel is never
      inside a blurred ancestor. (Apply the same pattern to the welcome, export,
      and lightbox overlays — they share the bug.)
- [x] **Consistent SVG icon set.** Replace UI emoji with simple modern stroke
      icons (sidebar ⚙/◐/⤓/⤒/🗑, the ✨ CTA, 👁/⊘ vision marks, key-help 🔑/💸,
      welcome-slide glyphs, etc.). One coherent style; accessible labels/titles.
- [x] **Settings IA cleanup.** Renamed 'Arbitration' tab to 'Consensus'; moved
      Agreement map toggle above arbiter picker; removed jargon 'structure/default
      arbiter' metadata; clearer helper text throughout; ⚡ emoji → SVG icon.
      A beginner should now grok the tab instantly.
- [x] **Apply blur-layer fix to remaining overlays** (welcome, export, lightbox).

---

## WEBSITE (kevinrhaas/polecat) — the loop's Part 2 should advance these too

**Periodic homepage glow-up (every few website passes — operator priority).** The app
has grown a LOT (agreement map, attachments, arbiter-only/synthesis-only, model server,
re-synthesis, etc.) and the homepage must show it off boldly. Every few website passes,
go beyond brand/changelog sync and meaningfully strengthen polecat.live's homepage to
reflect the current feature set — fresh screenshots/visuals, sharper copy, new sections.
The operator likes a **"YouTube-y", show-don't-tell visual** feel: lead with the product
in motion (demo clip / animated walkthrough / screen-capture), not paragraphs.

**Landing-page craft — treat as INSPIRATION, not gospel; apply judgement, a little each
pass, never a jarring rewrite, never regress:**
- **Hero sells it alone** — ~80% never scroll; a first-timer must *get it and want it* in
  seconds. One emotional, memorable headline a fifth-grader understands; describe the
  outcome, not features. The product should be sellable from the hero alone.
- **Numbers, not adjectives** — "Ask 7 models at once, get one answer you can trust" beats
  "fast & powerful." Concrete claims (model count, "100% in your browser", "your keys",
  "free demo, no signup").
- **One idea per screen / section** — each communicates one thing; don't cram.
- **Show, don't tell** — lead with a real demo/screen-capture; a short founder/screen
  recording beats a wall of features.
- **One CTA that says what happens** — a single primary action ("Try the free demo →"),
  not competing buttons; remove uncertainty about the next step.
- **Sell the human desire** (trust the answer, dodge one model's blind spots, save time),
  not the feature list.
- **Comparison vs single-model chat** — a simple table: Polecat vs ChatGPT/Gemini/Claude
  (multi-model, consensus, agreement map, BYOK, privacy) so "why use this" is obvious.
- **Proof** — add testimonials/quotes as they become available (even beta users).
- **OG image = YouTube thumbnail** — the `og:image` is seen more than the page; design it
  to make people click.
- **Ride the wave** — lean into the multi-model / AI-consensus moment.
- **Voice only you could write** — copy from the real product experience, not generic SaaS.
- **Strong, shareable footer** — memorable closing line + share/links.
- **Keep it ONE thing** — Polecat = ask every model at once, get one trusted consensus.
  Don't dilute that core promise.

- [x] **BUG (FIXED 2026-06-26): the homepage examples section was UNSTYLED.** Root
      cause: prior runs embedded the carousel inside a `<section class="band">` wrapper
      whose styles conflicted. Fixed by replacing the entire band+carousel block with
      the exact `<section class="pcx">` from `website/examples-carousel.html` (no outer
      wrapper; only `id="cases"` added to preserve the nav anchor). Cards, carousel, and
      consensus rows now render correctly.

- [x] **Fun, real example carousel.** Build it from the operator-curated REAL
      content in `website/examples.json` (6 examples: cooking, history, music,
      coding, travel, sports — each with the prompt, 2–3 differing model takes,
      and the consensus). Render as **uniform, brand-matched cards** (same frame/
      aspect/dark theme) — NOT raw screenshots; auto-rotate, pause on hover,
      swipeable on mobile, respect reduced-motion, link into the app / free demo.
      Show the "they disagreed → consensus reconciled" (and the one "they agreed →
      trust it") story. **Remove the old standalone "baking soda" example; keep the
      cooking one.** Quality & consistency over quantity.
- [x] Keep the website's brand, "last updated" stamp, and changelog in sync with
      the app; emphasise the cross-model consensus differentiator. (Ongoing — updated each run.)

---

## Backlog (smaller, pick up anytime)
- [x] **Consensus never goes blank on arbiter failure** (operator-reported 2026-06-30):
  when the chosen arbiter can't stream a synthesis (dead/exhausted/invalid key, network),
  all strategies now fall back to the most representative answer + local agreement
  provenance, with an amber explainer. (js/arbitration.js fallbackConsensus, js/app.js
  renderArbiterFallbackNote.) FOLLOW-UPS still open:
  - [x] **Decouple "Responses at a glance" from the agreement map (fixed 2026-07-01).**
    The per-model snapshot strip only needs the model answers, not the arbiter — it now
    renders after every consensus even when the agreement map (provenance) is turned OFF.
    Previously it only rendered as a side effect of `onProvenance()`, which is itself
    gated behind the provenance setting (`arbitration.js` `maybeProvenance`), so map-off
    users never saw it. `runConsensus()` and `rerunConsensusWith()` now call
    `renderModelSnapshotsEl()` unconditionally right after `runArbitration()` resolves
    (idempotent — it no-ops if the strip already exists from the live provenance path,
    and needs no provenance data since the stance/contribution badges on each card are
    already optional/graceful when missing).
  - [ ] **Proactive arbiter-health warning.** Before/at synthesis, if the chosen arbiter's
    provider has no key or a known-bad key (e.g. last call returned 401/credit error),
    surface a one-line warning in the Consensus tab up front rather than only after it fails.

- [x] Onboarding/demo polish: rotating clickable example questions (done), demo starts
  with two fast free models + light consensus (done), subtle first-time callout below
  the Consensus tab after first synthesis (done), staggered chip entrance after
  "Try it free" (done).
- [x] **README.md** for the repo: what Polecat is, the cross-model + consensus/arbitration
  differentiator, BYOK + zero-config free demo, the Cloudflare proxy, privacy
  (100% in-browser), the hourly self-improve loop, and links to app.polecat.live.
- [x] Gemini-style empty state: warm centered greeting with Polecat mascot logo
  (animated), cleaner subtitle copy; SVG plus icon in sidebar New chat button.
- [x] Centered composer when empty: greeting + prompt box sit together in the
  viewport center (Gemini/ChatGPT style); composer docks to the bottom on the
  first send.
- [x] Keyboard shortcuts cheatsheet; [x] per-model "regenerate"; [x] copy-as-markdown.
- [x] Shareable read-only consensus links (client-side encoded, no server). Share button on every consensus answer; URL-encoded payload (base64, UTF-8 safe); read-only modal with model responses + consensus + CTA.

- [x] **Responses at a glance.** After each consensus, a compact strip of per-model preview cards appears right below the consensus answer — each card shows the model's opening paragraph + response time + a "Full reply →" link to switch to that tab. Makes the multi-model comparison immediately scannable without any tab-switching.

### Operator-requested (carry-over from session 2026-06-27)
- [x] **BUG (HIGH): non-vision models get no hint an image was attached → confused
  answers.** Fixed: all three content builders (`oaiContent`, `claudeContent`,
  `geminiContents`) now inject `[The user attached N image(s) that this model can't
  view…]` when `opts.vision` is false and images are present. Vision models
  are unaffected.
- [x] **Show the time in Central Time (CT) on the "updated" stamps (operator-requested).**
  App changelog entries now carry a `time: "HH:MM CT"` field; What's-new panel
  shows it next to the date. Top-level `updated` also carries the full timestamp.
  Website footer updated in the same run.
- [x] **Polecat Model Server — website mention + public key page.** The provider is
  live (`polecatms`, modelserver.polecat.live, CORS enabled). In a website (Part 2)
  pass, add the free first-party model server to polecat.live's feature set. NOTE: a
  captcha-gated self-serve "get a key" page is server-side work in
  `kevinrhaas/solution-engineering/model-server` (out of this repo) — until it exists,
  keys are admin-minted, so don't advertise self-serve keys on the site yet.
- [x] **Consensus insight sentence (2026-06-28).** After each consensus, a brief
  plain-language summary appears before the detail panels — e.g. "All 3 models were
  in strong agreement" or "2 of 3 models agreed; GPT-4o had a contrasting perspective."
  Zero extra API calls; derived from the already-computed provenance data. Also
  replaced `✦` and `◎` unicode glyphs in empty states + progress box with proper SVGs.
- [x] **Periodic polish pass (2026-06-28).** Snapshot cards now have a quick copy button
  (hover/touch to copy that model's full response without switching tabs; text captured at
  render time to be correct on multi-turn conversations). Follow-up chips and re-synthesis
  strip moved before the provenance panel so the most actionable options appear first.
  Collapsed "Responses at a glance" toggle now shows colored model dots so users can see
  which models responded without expanding the section.
- [x] **Periodic mobile polish pass (2026-06-28).** "Responses at a glance" now defaults to
  collapsed on mobile (saves ~400px of vertical space); follow-up chips scroll horizontally
  on mobile instead of wrapping; consensus insight moved before the sources bar so the
  plain-language verdict is the first thing read after the answer; send button shows "Send"
  (not "Send to 1") for a single model.
- [x] **Response speed bars (2026-06-28).** Each model card in "Responses at a glance" now
  shows a thin colored speed bar (wider = slower, narrower = faster), making the multi-model
  response-time race immediately visual. The consensus sources footer also shows the response
  time range (e.g. 2.1s–8.9s), making the parallel execution advantage tangible at a glance.
- [x] **Contribution % in snapshot cards (2026-06-28).** Each "Responses at a glance" card
  now shows `~N%` — the estimated share of the consensus shaped by that model — as a colored
  pill in the metadata row (alongside stance and word count). Computed from already-available
  provenance data; no extra API calls. Makes the "who shaped the answer" story visible without
  needing to open the full provenance panel.
- [x] **Clickable model names + targeted debate chips (2026-06-28).** Model names in the
  "Where they differed" section now jump to that model's full response tab when clicked.
  Follow-up chips now include a targeted "Debate:" chip when models disagreed with named
  positions — pre-filling a rich prompt with each model's actual stance so they can engage
  directly with each other's reasoning. The debate chip has a brand-colored visual style.
- [x] **Format quick-actions on consensus (2026-06-28).** A "Format" sub-row in the
  re-synthesis strip lets users instantly reformat any consensus answer (Shorter, Bullet
  points, More detail, Simplify) without re-querying the models. The arbiter re-synthesizes
  from the same model responses using the current strategy plus the chosen format instruction.
  Strategy pills remain under a "Strategy" sub-label alongside the new "Format" row.
- [x] **"Ask about this" on disagreement points (2026-06-28).** Each disagreement item in the
  "How this was formed" provenance panel now shows an "Ask about this →" button. Clicking
  it pre-fills a rich, targeted prompt that names each model's exact stated position on that
  specific point — making it trivial to interrogate any divergence without typing from scratch.
- [x] **Model track record in Settings (2026-06-29).** After each consensus session, Polecat
  stores each model's stance and contribution % to localStorage. Settings → Models shows a
  subtle historical hint per model after 3+ sessions ("Usually aligns", "Often takes a distinct
  angle", "Mixed") with a tooltip showing exact session count and avg contribution %. Zero extra
  API calls — all derived from provenance data already computed in the page.
- [x] **Prompt history recall (2026-06-29).** Press ↑ in an empty composer to load the
  previous prompt; press again to go further back (up to 50 prompts stored). ↓ moves forward;
  typing anything exits history mode. Mentioned in the keyboard shortcuts cheatsheet (?).
  Zero API calls, purely localStorage.
- [x] **Stop generation (2026-06-29).** Red Stop button replaces Send while models are streaming.
  Click it (or press Esc) to abort all in-flight requests. Partial responses are kept with a
  subtle "(stopped)" label. Consensus is skipped when stopped. Each provider's existing
  timeout still applies; the Stop just adds a user-triggered abort on top.
- [x] **Contribution as ONE stacked 100% bar (operator-requested 2026-06-29).** In the
  "How this was formed" panel, replace the three separate per-model contribution lines/bars
  with a SINGLE horizontal stacked bar (full width = 100%), split into colored segments — one
  per model, each in that model's brand color, sized by its `contributionPct`. Contribution is
  a share of the whole, so a stacked bar reads far better than independent bars. Details:
  normalize segment widths so they fill 100% (the arbiter's % are approximate and may not sum
  to exactly 100 — keep showing the arbiter's value as the label, but scale widths to the sum);
  labeling needs care — show the % inline inside a segment only when it's wide enough, otherwise
  rely on a compact legend below the bar (color swatch + short model label + %); every segment
  gets a hover/tap tooltip with model name + %. Keep it accessible (never color-only — the
  legend carries text), reduced-motion friendly, and tidy on mobile. Keep the "(approximate)"
  caption. Single model → just a full-width bar (or skip). This replaces the current
  three-separate-bars layout.
- [x] **BUG (FIXED 2026-07-01, operator-requested 2026-06-30): Keys tab shows "connected" for
  an invalid key.** Settings → Keys now shows REAL verification, reusing the same probe /
  `modelStatus` cache the Models tab already uses (keyed by provider + default model). States:
  neutral grey "No key" / "Key added" (untested), yellow "Checking…" while a probe is in
  flight, green "Connected" only once a probe actually succeeds, red "Not connected" with the
  provider's error (e.g. "invalid x-api-key") in a title tooltip on failure. A probe fires
  automatically ~600ms after the key input stops changing (debounced), and any cached result is
  invalidated the moment the key text changes so a stale "Connected" never lingers for a key
  that's since been edited. A Claude Code OAuth token (`sk-ant-oat01-…`) is detected client-side
  by prefix — no network probe — and shows a red hint pointing at console.anthropic.com for a
  real API key. Every state pairs a small SVG icon (dot/clock/check/cross) with a text label,
  never color alone. Verified in a real headless-Chromium session: no key → "No key", a fake key
  → "Key added" → "Checking…" → "Not connected" (with error tooltip), an OAuth token → instant
  "Not connected" with the console.anthropic.com hint, zero console errors throughout.
- [x] **Models screen: ordering, visible roles, and arbiter-only models (operator-requested
  2026-06-30).** Make Settings → Models communicate and control each model's ROLE in a
  consensus run, not just the list. Can be split across runs:
  1. **Reorder selected models.** Let the user drag-to-reorder the rows (with up/down buttons +
     keyboard a11y as fallback). Order = `cfg.selections` array order and drives the response
     tab order / display order. Persist.
  2. **Show roles on this screen.** For each selected model, indicate its role: clearly mark
     which one is the **Arbiter** (the model that synthesizes the consensus — currently set
     only in the Consensus tab as `cfg.arbitration.arbiter`). Surface it here and let it be set
     here too (e.g. a small "Arbiter" radio/toggle per row), kept in sync with the Consensus tab
     (single source of truth). The others are the parallel "answerers". Make it legible at a
     glance who answers vs who arbitrates.
  3. **Arbiter-only mode (don't answer, just arbitrate).** Allow a selected model to be marked
     **arbiter-only**: excluded from the parallel answering round (no own answer/tab, not counted
     in "N models answered"), used SOLELY to synthesize the consensus from the others' answers.
     Operator's use case: set up several FREE models as answerers and use **Claude as an
     arbiter-only** — one high-quality synthesis call instead of answering+arbitrating, minimizing
     cost. This requires decoupling the arbiter from the answering set (today the arbiter must be
     one of the answering models — see `arbitration.js` ~line 320 `overrideId` path and ~348-352
     where the arbiter is pulled from `ctx.results`). Guard: need ≥1 answering model; if every
     selected model is arbiter-only, warn. Default behavior unchanged (arbiter = auto, all models
     answer). Accessible, mobile, light/dark, persisted, no regression to existing consensus.
- [ ] **Rethink the Models + Consensus screens so model ROLES + the consensus flow are obvious
  (operator-requested 2026-06-30).** PARTIALLY DONE (2026-07-01): the Consensus tab now opens with
  a pill flow ([answering models] → [arbiter] → [Consensus]) + a plain-language sentence, and both
  tabs cross-link to each other. Still open: unifying arbiter-only badges/jargon reduction below.
  Right now the config is split confusingly across two tabs and
  neither shows the whole picture: the **Models** tab lists selected models but not who arbitrates;
  the **Consensus** tab shows the strategy + arbiter model but gives NO indication of which models
  actually answer. A user can't see, in one place, the core story: "these N models answer in
  parallel → this arbiter (+ strategy) synthesizes → one consensus answer." This is the signature
  differentiator, so it must be effortless to understand. Do a holistic IA pass (per the North Star
  — reorganise/rename/move freely). Direction (use judgement):
    - Make the multi-model → consensus flow legible at a glance, ideally a small visual flow:
      [answering models] → [arbiter model + strategy] → [consensus answer] (echo the website hero).
    - On the Consensus tab, SHOW the answering set (not just the arbiter) — e.g. "Your 6 models
      answer in parallel, then GPT-4o validates & merges them" in plain language.
    - Clarify the arbiter selector's relationship to the model list: is the arbiter also one of the
      answerers, or arbiter-only? (ties directly to the "arbiter-only models" item above.)
    - Consider unifying or tightly cross-linking Models + Consensus so roles are understood
      together rather than in two disconnected places; reduce jargon ("arbiter", "strategy") with
      gentle inline explanations.
    - Beginner-first, accessible, mobile, light/dark; no regression to the existing config options.
  This and the "Models screen: ordering, visible roles, arbiter-only" item are the same theme —
  do them together or in sequence.
- [x] **BUG (operator-reported 2026-06-30): two conflicting "X of Y responded" counts on the
  consensus progress screen.** The top progress line ("Waiting for models — 7/8 responded",
  `refreshConsensusProgress` ~line 1334) uses `done/total` where `total` = all selected models.
  The bottom live-agreement pill ("6 of 6 responded — divergent views so far", `liveAgreementHtml`
  ~line 1314) uses a DIFFERENT pair: `doneIds.length of order.length`, where `order.length` is only
  the models already in the results pipeline and `doneIds` = responses >80 chars. So the two counts
  legitimately disagree (7/8 vs 6/6) on the same screen, which looks broken. Fix: don't show two
  contradictory "X of Y responded" counts. Preferred — drop the count from the live-agreement pill
  entirely and show just the agreement label (e.g. "divergent views so far"); the top line is the
  single authoritative responded count. If a count is kept on the pill, it MUST use the same total
  as the top line and be clearly distinct (e.g. "agreement so far, based on N of {total}") so the
  two numbers can never contradict. Keep the live agreement signal itself (it's a nice feature) —
  just remove/reconcile the confusing second counter.
- [x] **BUG (operator-reported 2026-06-30, FIXED): restored chats lose the consensus provenance /
  "How this was formed" analysis (contribution charts, agreement map).** `recordTurn` now persists
  `provenance: lastConsensusProvenance` on each saved turn, and `restoreThread` renders the full
  panel (+ snapshot stance/%, follow-up chips, re-synthesis strip) from `turn.provenance` for both
  earlier and the last turn. Degrades gracefully for old saved chats with no provenance.
- [x] **Restore inline source-attribution highlighting on reopened chats (2026-07-01, follow-up to
  the provenance-restore fix).** The remaining gap after the fix above: EPIC 1 · P4 inline
  attribution (the toggle that color-highlights consensus paragraphs by originating model) wasn't
  re-applied on restore — it only ran in the live `onProvenance` path. Fixed by extracting that
  logic into a shared `tryApplyInlineAttribution(pair)` (uses the current `order`/`results`/
  `lastConsensusText` globals, which `restoreThread` already repopulates from the last turn) and
  calling it from both `onProvenance` and `restoreThread`. Verified in a real headless-Chromium
  session: seeded a 2-model consensus thread into `polecat_history`, reopened it from the sidebar,
  confirmed the highlight toggle button appears, both paragraphs get model-attributed coloring, and
  clicking the toggle activates `.attribution-active` — zero console errors.
- [ ] **Make the consensus "race bar" self-explanatory (operator-reported 2026-06-30).** The row
  of colored dots under "Blended from N models" (`js/app.js` ~line 1392-1408, `.cs-race` /
  `.cs-race-dot`) plots each model by response time — a nice "parallel execution" visual — but
  it's unlabeled, so users can't tell what it is. Each dot already has a desktop `title`
  (model + time, e.g. "Groq · GPT-OSS 120B: 3.3s"), but: (a) there's NO caption saying what the
  bar represents; (b) the whole thing is `aria-hidden="true"` so screen readers skip it; (c)
  `title` tooltips don't appear on touch/mobile. Fix: (1) add a small visible caption/legend —
  e.g. "Response speed · fastest → slowest" (with a faint fastest←→slowest axis hint), so it
  reads as a finish-order/speed race at a glance; (2) make each dot's info available on TAP as
  well as hover (a tiny popover with model name + time + finish rank, e.g. "1st · 3.3s"), since
  hover-only fails on mobile; (3) give it an accessible description instead of pure aria-hidden —
  an sr-only summary like "Response times: Groq 3.3s (fastest) … Claude 17s (slowest)" so the
  info isn't lost to screen readers. Keep it compact, on-brand, light/dark, mobile-tidy.

### Data durability — keep users' keys/chats/settings across updates (operator priority 2026-06-30)
**STANDING (sacrosanct, EVERY run):** never lose user data. NEVER change the localStorage
keys (`STORAGE_KEY='polecat'`, `HISTORY_KEY='polecat_history'`, `THEME_KEY`, etc.) or rename
them. Evolve the saved shape ONLY via additive defaults in `normalize()` or a proper
`MIGRATIONS[n]` step (bump `SCHEMA_VERSION`) that preserves all existing fields. Never wipe,
reset, or clear storage on load/upgrade; corrupt data is backed up, not dropped. App updates
must always carry over keys, chats, models, and preferences. (Note: deploys already preserve
localStorage — verified the keys have never changed. The real loss vector is BROWSER eviction,
addressed below.)
- [x] **Request persistent storage** — call `navigator.storage.persist()` on load so the
  browser won't evict our data under pressure/inactivity (done; best-effort, silent where
  unsupported).
- [x] **Make Polecat installable (PWA) + iOS durability (shipped 2026-06-30).** Added
  `manifest.webmanifest` (name, short_name, description, icons at 192/512 incl. maskable,
  standalone display, start_url, theme/background color matching the header) plus
  `apple-mobile-web-app-capable` / `apple-mobile-web-app-status-bar-style` /
  `apple-mobile-web-app-title` and `mobile-web-app-capable` meta tags + the manifest `<link>`
  in `index.html`'s head. Reuses existing favicon assets; no service worker, no new tracking.
  This is the durable fix for **iOS Safari**, which evicts localStorage after ~7 days of not
  visiting a non-installed site. FOLLOW-UP (left for a future run): an optional, dismissible
  "Add to Home Screen to keep your data" hint on iOS Safari.
- [ ] **One-tap backup nudge / auto-export.** Export/Import already exist — make backup
  easier: a gentle, infrequent reminder to export a backup (especially before clearing data),
  and/or a "last backed up" note. Consider an optional auto-download snapshot. Low-friction,
  never nags.
