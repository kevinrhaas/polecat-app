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
   was already wired.) The backup nudge (below) is now also DONE, closing out this item.
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
   badge/jargon unification work. STEP 3 DONE (shipped 2026-07-01): unified the
   "synthesis only" (arbiter-only) badge/control across both tabs. Previously the
   toggle lived ONLY on the Models tab's arbiter row, so the Consensus tab's arbiter
   dropdown ("Claude · Opus 4.1 (synthesis only)") and its pill-flow arbiter chip had
   no way to reflect a change until Settings was reopened (both tabs render once on
   open; switching tabs is pure CSS show/hide, so stale state could sit unnoticed).
   Now: (1) the Models tab's checkbox also calls `renderArbitration()` so the
   Consensus tab never goes stale while Settings is open; (2) the Consensus tab
   gained its own reciprocal "Synthesis only" checkbox right under the arbiter
   picker, wired to the same `sel.arbiterOnly` field and refreshing both tabs; (3)
   the pill-flow's arbiter chip now appends a small " · synthesis only" tag when
   set, so the mode is visible in the flow itself, not just in a dropdown label.
   Verified in a real headless-Chromium session: toggling either checkbox instantly
   updates the other tab and the flow pill, zero console errors. STEP 4 DONE
   (shipped 2026-07-01): the "Building consensus" progress screen (shown on
   EVERY consensus run, `js/app.js` `refreshConsensusProgress`) used to headline
   the raw strategy name + jargon, e.g. "Sequential Refinement · arbiter: auto
   (strategy default)". Rewrote it to the same plain-language pattern already
   used on the Consensus settings tab's pill flow — "3 models answering in
   parallel, then Claude · Opus 4.1 merges them into one answer." (or "the
   strategy auto-picks one to merge them" when the arbiter is auto). The
   technical strategy name moved to a hover `title` tooltip instead of being
   in the visible copy. This is higher-visibility than the settings-tab copy
   since every user sees it on every run, not just when opening Settings.
   STEP 5 DONE (shipped 2026-07-01): renamed the "Strategy" dropdown option
   names themselves from technical labels to plain language — "Sequential
   Refinement" → "Refine Together", "Single Judge — Comprehensive" → "Merge
   Everything", "Single Judge — Best Answer" → "Best Answer", "Validated
   Synthesis" → "Fact-Checked Merge", "Debate & Synthesize" → "Debate & Merge"
   (`js/arbitration.js` `DEFAULT_STRATEGIES`). These names also appear in the
   consensus answer's source footer ("Blended from N models · Merge
   Everything"), so the plain wording carries through everywhere the
   strategy name surfaces. Display names only — ids, prompts, and any saved
   `cfg.arbitration.activeId` are untouched, so no migration is needed.
   STEP 6 DONE (shipped 2026-07-01): swept the remaining "arbiter" jargon from
   user-facing copy across both tabs and the welcome flow. Consensus tab: the
   "Arbiter model" selector is now labelled "Final answer written by" (mini-note
   "combines every model's answer into one — defaults to the strategy's pick");
   the flow pill's auto-pick placeholder changed from "Auto arbiter" to "Auto
   pick"; the flow sentence's fallback clause changed from "the strategy
   auto-picks an arbiter to merge them" to "the strategy auto-picks one to
   merge them". Models tab: the per-row toggle button changed from "Arbiter" to
   "Final answer" with plain-language tooltips ("Writes the final answer —
   click to switch back to auto" / "Set this model to write the final
   answer"), and its reciprocal link to the Consensus tab changed from
   "Arbiter & consensus strategy are set in the Consensus tab" to "Who writes
   the final answer, and how, is set in the Consensus tab". Also updated: the
   "Merge Everything" and "Best Answer" strategy descriptions (`arbitration.js`
   `DEFAULT_STRATEGIES`) no longer say "arbiter"; the source-chip tooltip on a
   consensus answer now reads "Wrote the final answer" instead of "Final
   arbiter — wrote this consensus"; the arbiter-failure fallback note now says
   "the model chosen to write the final answer" / "pick a different model to
   write the final answer" instead of "the chosen arbiter" / "Arbiter model";
   and the welcome carousel's example slide now says "set Claude Opus to write
   the final answer" instead of "as the arbiter for the final call". Internal
   identifiers (`cfg.arbitration.arbiter`, `arbiterOnly`, `setArbiter()`, CSS
   classes like `.sel-arb`/`.cs-arbiter`) are untouched — display copy only, no
   data migration needed. This closes out the DO THIS NEXT jargon-reduction
   theme. The Models+Consensus IA rethink tracked in the Backlog section below
   is ALSO now done (2026-07-02): the two tabs were merged into one "Models &
   Consensus" tab. With that, every step of this DO THIS NEXT theme is complete.

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
- [x] **BUG (FIXED 2026-07-03, 20:14 CT): the examples carousel (the homepage's signature
      "they disagreed → consensus reconciled" showcase) was completely unreachable by keyboard.**
      Its horizontal scroll row had no `tabindex` and no focusable children inside the cards, so a
      keyboard-only visitor could Tab straight past the section and only ever see the first of 6
      cards. Added `tabindex="0"` + `role="region"` + a visible focus ring to the scroll container
      so arrow keys now page through all 6 cards. Verified in headless Chromium (scrollLeft moves
      from 0 to 356px on 3x ArrowRight while focused, visible purple outline).
- [x] **POLISH (FIXED 2026-07-04, 04:17 CT): two raw glyphs slipped past the site's last two
      emoji/icon sweeps.** With the website roadmap section fully checked off, ran a real
      headless-Chromium audit of the homepage (scrolled the full page, checked images, links,
      and mobile overflow — zero bugs found) and then looked for the same glyph-consistency issue
      the last two site passes had already fixed twice. Found two survivors: the agreement-map
      mockup's "Where they agreed" note still used a plain `✓` character while its sibling "Where
      they split" note, in the identical icon slot one row below, already used a proper stroke
      SVG; and the closing "leave a tip ☕" link used a real emoji, inconsistent with the app's own
      tip-jar UI (Settings → Support), which uses plain text tier buttons with no emoji at all.
      Replaced both with small stroke SVGs matching the page's existing icon convention (13px,
      `currentColor`, `aria-hidden`). Verified in a real headless-Chromium session: both render
      crisply in place with no layout shift, `node scripts/validate.mjs` passes.
- [x] **POLISH (FIXED 2026-07-04, 11:47 CT): axe-core audit found two real a11y bugs in the
      comparison table.** Ran an automated axe-core scan (desktop + mobile) instead of another
      manual sweep. Found: (1) `.compare-wrap` (the horizontally-scrolling wrapper around the
      "Polecat vs. a single-model chat" table) had no `tabindex`, so keyboard/screen-reader users
      could never scroll it to see the Polecat column — the same bug class fixed on the examples
      carousel earlier. Added `tabindex="0"`, `role="region"`, an `aria-label`, and a focus ring.
      (2) The table's blank corner `<th scope="col">` had no discernible text — added a
      visually-hidden "Feature" label via a new `.sr-only` utility. Left the examples carousel's
      `.pcx-clabel` contrast finding alone, per the prior pass's explicit call that the `.pcx-*`
      block is the verified, do-not-rewrite component. Verified with a real headless-Chromium +
      playwright-core session: axe-core violations drop from 2 fixable to the one pre-existing
      carousel note, arrow keys move the table's `scrollLeft`, zero visual change, zero console
      errors, `node scripts/validate.mjs` passes.
- [x] **POLISH (SHIPPED 2026-07-04, 12:54 CT): gave the "How consolidation works" flow diagram
      subtle live motion**, acting on the "show, don't tell, product in motion" direction that
      hadn't been touched since the section was built — the diagram explaining consensus was
      itself completely static. Added three small CSS-only touches (staggered pulsing model dots,
      a small dot traveling down/across the connecting line, a gentle breathing glow on the
      Consensus card), all scoped to this one diagram and all respecting
      `prefers-reduced-motion`. Verified in headless Chromium at desktop + 390px mobile: zero
      console errors, no layout shift, `node scripts/validate.mjs` passes.

---

## Backlog (smaller, pick up anytime)
- [x] **BUG (FIXED 2026-07-04, 12:46 CT): follow-up chips and the "try another strategy"
  re-synthesis strip vanished when the agreement-map toggle was off.** With the roadmap and
  backlog fully checked off, read through `runConsensus()`/`onProvenance()` in `js/app.js`
  instead of another manual click-through — a comment already sitting right there explained why
  the "Responses at a glance" snapshot strip had to be force-rendered *outside* the provenance
  callback ("only needs the model answers, not the arbiter's provenance analysis"), which was a
  strong hint the same class of bug existed elsewhere. It did: `renderFollowUpChips()` and
  `renderResynthStrip()` were only ever called from inside `onProvenance()`, which
  `arbitration.js`'s `maybeProvenance()` never invokes when `cfg.arbitration.provenance` is off
  (`ctx.provenanceEnabled` gate at `js/arbitration.js:296`). So turning off the agreement-map
  toggle — a first-class, persisted setting, not an edge case — silently killed two real,
  actionable features (follow-up question chips, and the zero-extra-call "try a different
  synthesis strategy" strip) on every live consensus answer, not just the analytical panel the
  toggle was meant to hide. Confirmed the intended behavior via `restoreThread()`, which already
  renders all three unconditionally on a reopened chat — the live path had just never been
  updated to match. Fixed by rendering `renderFollowUpChips()` and `renderResynthStrip()`
  unconditionally after `runArbitration()` in `runConsensus()`, same pattern as the existing
  snapshot-strip fix (both render fns already guard against double-rendering, so this is a no-op
  when `onProvenance` already rendered them). Verified live in a real headless-Chromium session
  with two mocked demo-model responses and agreement-map off: reproduced the bug on the pre-fix
  code first (chips and strip both absent), then confirmed the fix (both present, zero console
  errors). `node scripts/validate.mjs` passes. `js/app.js` only, no change to the panel itself or
  its on/off toggle.
- [x] **BUG (FIXED 2026-07-04, 11:40 CT): the "How this was formed" provenance panel's
  aria-controls pointed at a nonexistent element.** With the roadmap and backlog fully checked
  off, audited the EPIC 1 provenance/agreement panel — the disclosure that explains how each
  consensus answer was formed, the feature most directly showcasing the multi-model
  differentiator — for accessibility instead of another visual pass. `renderProvenancePanel()`
  in `js/app.js` built the toggle button's `aria-controls` from `pair.id`, but `pair` (the
  `.qa-pair` container) never had an `.id` assigned anywhere in the file, so every consensus
  answer rendered `aria-controls="prov-body-"` — pointing at nothing. Screen-reader users got
  no programmatic disclosure relationship for the panel. Fixed by generating a real unique id
  for the panel body and using it on both the button and the body div. Verified
  `node scripts/validate.mjs` passes and the toggle's expand/collapse/auto-expand-on-disagreement
  behavior is unchanged.
- [x] **BUG (FIXED 2026-07-04, 10:48 CT): the model/consensus tab bar could hide the Consensus
  tab off-screen on mobile with no scroll cue.** Right after the previous run shipped a
  scroll-fade hint for the composer's model-chip row (see the changelog entry immediately
  below), seeded a synthetic 3-model consensus thread and drove it in a real headless-Chromium
  mobile session (390px) to check whether the same hidden-scrollbar pattern existed elsewhere.
  It did, on a more consequential element: `.tab-bar` (the row of per-model tabs plus
  "Consensus") also sets `overflow-x: auto; scrollbar-width: none`, so with 3 models selected
  the tab bar overflowed by 209px on a 390px screen and the Consensus tab - the actual
  synthesized answer, Polecat's core value - was scrolled off-screen with no visual indication
  there was more to swipe to. Fixed with the identical fade-affordance pattern just shipped for
  the chip row: a `.tab-bar-wrap` around `#tabBar` with a `#tbFade` element that only shows
  when `scrollWidth - clientWidth - scrollLeft > 4`, wired to `scroll`/`resize` and recomputed
  whenever `ensureTabs()`/`pruneTabs()` change the tab set. Verified in headless Chromium: fade
  shows exactly when tabs overflow, hides at the scroll end and when everything fits (desktop,
  or the empty pre-chat state with no tabs at all), light + dark theme both correct, zero
  console errors, `node scripts/validate.mjs` passes. No change to tab click/keyboard behavior.
- [x] **BUG (FIXED 2026-07-04, 08:56 CT): the over-budget attachment warning told users the
  wrong files would be cut.** With the roadmap and backlog fully checked off, read through the
  file-attachment context-budgeting logic in `js/app.js` (EPIC 2's F4 token budgeting) instead of
  another browser click-through, since that logic hadn't had a code-level correctness pass since
  it shipped. Found: `updateVisionNote()`'s over-budget warning read "over 40k limit; **oldest**
  files will be trimmed on send" — but `buildTextBlocks()`, which actually enforces the budget,
  walks `textFiles` in attachment order (oldest-attached first) and skips/truncates whatever
  comes AFTER the budget runs out, i.e. it keeps the oldest-attached files intact and drops the
  most-recently-attached ones first — the exact opposite of what the warning claimed. This is a
  realistic trust problem, not cosmetic: a user attaching several documents and seeing "oldest
  will be trimmed" would reasonably conclude their latest, probably most-relevant attachment is
  safe, when it's actually the one at risk of being silently dropped. Fixed by correcting the
  copy to "the most recently attached files will be trimmed first on send," matching the real
  behavior. Pure copy fix, no logic changes — verified by re-reading `buildTextBlocks()`'s loop
  order and `node scripts/validate.mjs` passes.
- [x] **PERIODIC BEST-PRACTICE PASS (2026-07-04, 06:58 CT): automated accessibility audit instead of another
  manual bug hunt.** After a long streak (30+ consecutive runs) of single-bug headless-Chromium hunts with no
  holistic pass, per the standing "periodic best-practice pass" directive, ran an automated axe-core audit
  across the empty state, all three Settings tabs, and the sidebar (open + mobile), rather than another manual
  click-through. Found and fixed: (1) a genuinely visible dark-mode bug - the composer's dashed "+ Add" model
  chip is a native `<button>` with no background override, so Chromium's default light-gray button face
  rendered as a jarring pale pill next to its plain transparent sibling chips, with low-contrast text on top
  (`css/styles.css` `.m-chip-add` now sets `background: none`); (2) `#privateSwitch` (the Private mode toggle)
  had no accessible name for screen readers - added `aria-label="Private mode"`; (3) continued the token-level
  contrast cleanup explicitly flagged-but-deferred in an earlier pass (see the two "low-contrast" entries
  above) - bumped `.logo-ver`, `.no-config-hint`, `.cfg-sub`, `.field-hint`, `.key-status`, `.key-tier.paid`,
  `.mini-note`, and `.sb-empty` from `var(--text-3)` (~2.2:1 in dark mode) to `var(--text-2)` (~5.5:1, passes
  WCAG AA), matching the same precedent already applied to `.msg-label`/`.arb-plabel`/`.sb-section-label`/
  `.prov-section-label`/`.sb-date-group`. Left alone: axe's remaining "moderate" landmark/heading-structure
  findings (no `<main>`, no `<h1>`, several regions not in a landmark) - a larger, riskier structural change
  better suited to its own dedicated pass, not bundled into this one. Verified in a real headless-Chromium
  session (light + dark, desktop + mobile): axe-core reports zero serious-impact violations across every
  screen audited (down from `aria-toggle-field-name` + `color-contrast` on every single screen), zero console
  errors, no layout shift, no regression to any existing feature. `node scripts/validate.mjs` passes.
- [x] **BUG (FIXED 2026-07-04, 04:10 CT): deleting a single saved conversation from the sidebar
  had no confirmation, unlike every other destructive action in the app.** With the roadmap and
  backlog fully checked off, ran a real headless-Chromium session (Puppeteer + system chromium)
  seeding two synthetic threads into `polecat_history` and driving the sidebar's history list —
  search, pin, rename, delete — instead of another code-only sweep. Found: clicking a
  conversation's `.sb-del` ("×") button called `deleteThread(id)` (`js/app.js`), which filtered
  the thread out of `history` and saved immediately with zero confirmation — no dialog, no
  undo, no toast. This is inconsistent with the app's own established pattern: `clearHistory()`
  (delete ALL conversations) and the Keys tab's `clearKeys` handler (delete all API keys) both
  gate on `confirm(...)` with an explicit "This can't be undone" — but the single-conversation
  delete, arguably the MORE commonly-used destructive action since it's one click away in a
  cramped hover-revealed icon row right next to Pin and Rename, had no such guard. A single
  misclick permanently destroyed a conversation with no recourse, directly contradicting the
  "Data durability" section's standing "never lose user data" directive. Fixed by adding the same
  `confirm('Delete "<title>"? This can\'t be undone.')` gate used elsewhere, looking up the
  thread's title first so the dialog names the specific conversation being deleted (clearer than
  a generic "delete this conversation?"). Verified in a real headless-Chromium session: dismissing
  the dialog leaves the conversation untouched in the list, confirming it removes exactly that
  conversation and none other, search/pin/rename all continue to work unchanged, zero console
  errors. `node scripts/validate.mjs` passes. No UI/HTML changes needed — the fix is entirely in
  `js/app.js`'s `deleteThread()`.
- [x] **BUG (FIXED 2026-07-04, 02:23 CT): attaching a Word (.docx) file never confirmed its text
  was extracted, unlike PDF/PPTX/XLSX.** With the roadmap and backlog fully checked off, drove a
  real headless-Chromium session (Puppeteer + system chromium) attaching real test files of all
  four supported document types (a generated PDF, DOCX, PPTX, XLSX) instead of another code-only
  sweep. Found: the PDF, PPTX, and XLSX attachment chips all show a confirmation count once
  extraction finishes ("2 pages extracted", "1 slides extracted", "1 sheets extracted") in both
  the visible chip label and its tooltip, and the same counts are passed to every model as a type
  hint ("PowerPoint presentation, 1 slides"). A DOCX attachment extracted its text via mammoth.js
  correctly (confirmed the text was present and injected), but `renderAttachments()`'s
  `metaLabel`/`tipText` branches (`js/app.js`) and `buildTextBlocks()`'s `typeHint` branch had no
  `docType === 'docx'` case with a count, unlike its pptx/xlsx siblings — so the chip silently fell
  through to the generic `fmtBytes(a.size)` label, identical to how an unrecognized file would
  render, leaving a beginner with no confirmation their Word document was actually read (vs. just
  attached as opaque bytes). Fixed by having `readDocxFile()` compute a paragraph count from the
  extracted text (matching the existing `slideCount`/`sheetCount`/`pageCount` pattern) and adding
  the matching `docType === 'docx'` branch in all three spots so it now reads "N paragraphs
  extracted" everywhere a pptx/xlsx file would show its own count, and the model-facing type hint
  becomes "Word document, N paragraphs" instead of a bare "Word document". Verified in a real
  headless-Chromium session: all four file types now show a matching "N extracted" confirmation
  label after upload, zero console errors, zero regression to PDF/PPTX/XLSX (their labels are
  byte-for-byte identical to before).
- [x] **POLISH (FIXED 2026-07-04, 00:38 CT): Settings modal left a big empty gap on short tabs
  (e.g. Support).** With the roadmap and backlog fully checked off, did a UI sweep of every
  Settings tab in a real headless-Chromium session (desktop + mobile, light + dark) instead of a
  scripted next step. `.modal-body` (`css/styles.css`) used a fixed `height: clamp(300px, 62vh,
  470px)` so every tab shared one size — fine for the tall Models/Keys tabs, but it left roughly
  half the dialog as dead space below the Support tab's one paragraph + tip-jar buttons. Changed
  `height` to `max-height` so each tab now sizes to its own content; tall tabs still cap out at
  the same clamp and scroll internally, unchanged from before. Verified all three tabs on desktop
  and mobile: Models/Keys pixel-identical, Support now hugs its content, no layout jump switching
  tabs.
- [x] **BUG (FIXED 2026-07-03, 22:32 CT): Settings force-opened on EVERY page load for a returning
  visitor with no key and no demo model.** With the roadmap still fully checked off, ran a real
  headless-Chromium session (Puppeteer + system chromium; playwright wasn't cached locally, so used
  puppeteer-core against `/usr/bin/chromium` instead — same audit approach as prior runs) simulating
  a returning visitor: `localStorage.polecat_welcomed = '1'` already set (so the welcome tour's own
  `!seen` gate correctly skips it), but no provider key and no demo model selected — a realistic,
  common state (anyone who clicked "Skip" on the welcome tour without adding a key, or who later
  cleared their keys/selections). Confirmed via `document.getElementById('configModal').classList`
  that Settings rendered `open` on the very first load — then, more importantly, drove the full
  cycle (load -> manually click the modal's own close button, exactly like a real user dismissing
  it -> `page.reload()`) and found it popped open again immediately, with no way to make it stop
  short of adding a key or trying the demo. Root cause: `init()`'s `else if (!hasKeys)` branch
  (`js/app.js`) that auto-opens Settings on the Keys tab had no once-only guard, unlike its sibling
  branch one line above (`!hasKeys && !seen`, which correctly gates the welcome tour on `WELCOME_KEY`
  so it only ever shows once) — so on every subsequent page load/refresh, for as long as the user
  has no key or demo model, this branch fires again unconditionally, forcing Settings over the
  entire screen every single time, directly contradicting the "no jarring, no nagging" north star
  and the app's own precedent of one-time nudges (`WELCOME_KEY`, `CONS_HINT_KEY`, `BACKUP_NUDGE_KEY`
  already exist for exactly this purpose). Fixed by adding a matching one-time `KEYS_NUDGE_KEY`
  (`polecat_keys_nudge_shown`) flag, set the moment the no-keys nudge is shown from either of its
  two call sites (`init()`'s fallback branch, and `dismissWelcome()`'s own no-keys nudge right after
  the welcome tour), and checked before firing again. Verified three scenarios in headless Chromium:
  (1) a brand-new visitor still sees the welcome tour, and skipping it without a key still opens
  Settings once as before; (2) the exact repro above — load, close, reload — now stays on the chat
  screen on reload instead of re-opening Settings; (3) a visitor with a demo model already selected
  (seeded via `localStorage.polecat`) never sees the nudge at all, unchanged. `node scripts/
  validate.mjs` passes. No UI/HTML changes needed — the fix is entirely in `js/app.js`'s init/dismiss
  logic.
- [x] **BUG (FIXED 2026-07-03, 21:10 CT): opening Export, What's New, or Compare from the sidebar
  left the sidebar rendered dark and blurry underneath, even in light theme.** With the roadmap
  still fully checked off, ran a real headless-Chromium session (Playwright + system chromium) in
  light theme, opened the sidebar, then clicked "What's new" — the modal itself rendered fine, but
  the sidebar behind it was visibly dark (near-black background, light text), as if it had switched
  to dark theme. Confirmed via a repro script that `data-theme` stayed `"light"` the whole time — it
  wasn't a theme bug at all. Root cause: this is the mirror image of the earlier sidebar-stacking bug
  (see the Shortcuts/Settings blur fixes above, where the sidebar's z-index sat ABOVE those modals'
  backdrops and covered them) — here `.exp-overlay` (Export/What's New, z-index 500) and
  `.compare-overlay` (Compare, z-index 1200) sit ABOVE the sidebar (z-index 250), so their dark,
  blurred `::before` backdrop renders on top of a still-open sidebar and visually tints it dark
  regardless of the active theme. `openConfig()` and `openKbd()` already call `closeSidebar()` first
  for exactly this reason; `openExport()`, `openWhatsNew()`, and `openCompareModal()` never got the
  same treatment. Fixed with the same one-line `closeSidebar()` call at the top of all three. Verified
  in headless Chromium (light theme): opening Export or What's New from the sidebar now closes it
  first and the modal's backdrop shows the correct light page behind it, zero console errors.
- [x] **BUG (FIXED 2026-07-03, 20:09 CT): the one-time "tap a model tab" onboarding tip could fire
  on a FAILED consensus run, then never show again.** With the roadmap still fully checked off, ran
  a real headless-Chromium session (Playwright + system chromium) through the free-demo flow and the
  actual send path, then specifically simulated a run where every model fails (all keys missing /
  network blocked — a realistic first-run state, e.g. an ad blocker or firewall blocking the demo
  proxy). Found: `maybeShowConsHint()` (`js/app.js`), the callout that teaches new users "That's your
  synthesized answer — tap any model tab above to read each one's individual response," was called
  unconditionally from `sendAll()` after `runConsensus()` resolved, with no check for whether the run
  actually produced a synthesized answer or the "All models failed to respond — no consensus
  available" error bubble. Beyond just being confusing copy on a failed run, this is a permanent loss:
  the tip is gated by a `localStorage` flag so it only ever shows once per browser (by design, so
  it doesn't nag returning users) — so a first-time user whose very first attempt happened to fail
  (a very plausible first-run scenario) would silently lose this onboarding moment forever, even
  though every later successful consensus would have been a valid time to show it. Fixed by having
  `maybeShowConsHint()` check the just-rendered consensus pair for a `.msg-error` bubble (the exact
  class `showConsensusStatic(text, isError)` renders for the failure path) and bail out before
  setting the localStorage flag, so a failed first attempt leaves the hint armed for the next
  successful one. Verified in headless Chromium with two scenarios: a real failed run (network
  blocked) now shows zero copies of the callout and leaves the flag unset, while a mocked successful
  streamed consensus (via `page.route`) still shows the callout exactly as before, anchored under
  the Consensus tab with full contribution bars, "Responses at a glance," and follow-up chips intact
  — no regression to the success path. `node scripts/validate.mjs` passes.
- [x] **BUG (FIXED 2026-07-03, 18:43 CT): a "Synthesis only" (arbiter-only) final-answer model was
  silently skipped whenever only ONE model actually answered.** With the roadmap still fully
  checked off, re-examined `js/arbitration.js` right after the previous run's `runChain()` fix for
  the same class of bug (arbiter-only models being invisible to code paths that only look at
  `ctx.results`, the list of models that actually answered), on the theory that the entry point
  `runArbitration()` itself might have the same blind spot at a different boundary. Confirmed with
  a standalone Node harness (imports the module directly, mock `ctx` callbacks, no network calls):
  `runArbitration()` had an early-return fast path — `if (results.length === 1) { ctx.showStatic(
  results[0].text); return; }` — that fires BEFORE the strategy dispatch (`chain`/`judge`/`debate`),
  so it ran even when the configured "final answer" model was a valid arbiter-only model waiting to
  synthesize. This hits a realistic, encouraged config: the operator's own documented arbiter-only
  use case ("set up FREE models as answerers and use Claude as an arbiter-only synthesizer") applies
  just as much with exactly one fast/free answering model plus one high-quality arbiter-only
  polisher/fact-checker as it does with several answerers — but with one answerer, the arbiter-only
  model was never called at all, and the raw unsynthesized single answer was shown as "the
  consensus" with no error or indication anything was skipped. Fixed by computing whether the
  configured final-answer id resolves to a real selection that is NOT among `results` but IS among
  `ctx.allSelections` (i.e., a genuine external/arbiter-only finisher) and skipping the single-model
  shortcut in that case only, falling through to the normal strategy dispatch — each of which
  (`runChain`, `runJudge`, `runDebate`) already resolves an arbiter-only finisher correctly via
  `ctx.allSelections`/`resolveArbiter`. Verified with 6 scenarios in the Node harness: arbiter-only
  finisher with 1 answerer under all three structures (chain/judge/debate) now correctly invokes the
  finisher and streams its answer; the three no-regression cases — auto arbiter with 1 answerer,
  an explicit final-answer model that IS the sole answerer, and the normal 2-answerer path — all
  keep their exact prior behavior (instant shortcut / no wasted extra call). `node scripts/
  validate.mjs` passes. No UI/HTML changes needed.
- [x] **BUG (FIXED 2026-07-03, 17:47 CT): an arbiter-only ("Synthesis only") model set as the
  "Final answer" writer was silently ignored under the default "Refine Together" strategy.**
  With the roadmap still fully checked off, read through `js/arbitration.js`'s `runChain()`
  (used by the "chain"-structured strategies, including the default "Refine Together") looking
  for correctness bugs, then confirmed the finding with a standalone Node harness that imports
  the module directly and drives it with mock `ctx` callbacks (no network calls). Root cause:
  `runChain()` only reorders `ctx.results` — the models that actually answered — so a chosen
  arbiter (`ctx.arbiterId`) writes the final, streamed answer. An arbiter-only model never
  answers (it's excluded from `results` by design, so it can synthesize without also being one
  of the answering voices), so the lookup `ctx.results.find(r => r.selection.id === ctx.arbiterId)`
  always failed for it, `seq` silently fell back to its original order, and the LAST model in
  the natural answering order wrote the "final" answer instead — while the UI kept showing the
  arbiter-only model as the one set to write it, with no error or indication anything was wrong.
  This combination (arbiter-only + chain strategy) wasn't an edge case: "Refine Together" is the
  default active strategy, so any user who set a "Synthesis only" model without also switching
  to a judge-structured strategy ("Merge Everything", "Best Answer", etc.) hit this silently.
  Fixed by having `runChain()` detect this case (arbiter id resolves in `ctx.allSelections` but
  not in `ctx.results`) and, after the answering models finish refining the running draft as
  normal, hand that draft to the arbiter-only model for one final streamed pass — so it
  genuinely writes the final answer, matching what the UI already claimed. Failure handling
  (`ctx.arbiterFailed`, fallback to the best available draft) now also correctly attributes a
  failed final pass to the arbiter-only model instead of silently mislabeling a different one.
  Verified with 4 scenarios in the Node harness (arbiter-only finisher happy path, an explicit
  answering-model arbiter, `auto`, and an arbiter-only finisher whose call throws) — all behave
  as intended; `node scripts/validate.mjs` passes. No UI/HTML changes needed.
- [x] **BUG (FIXED 2026-07-03, 16:53 CT): reopening a saved chat could strand the user on a
  blank screen if the browser no longer had a key for a model in that thread.** With the
  roadmap still fully checked off, seeded a synthetic 3-model consensus thread straight into
  `polecat_history` and drove a real headless-Chromium session (Playwright + system chromium)
  to exercise the restore path, since it's been the source of several real bugs in recent
  passes (stale tab badges, provenance not repopulating, etc.). This time with a twist: the
  session had zero API keys configured for the thread's providers (Claude/Gemini/ChatGPT) —
  a realistic case (cleared keys, a new device, or a history import before re-adding keys are
  all flows the app already supports elsewhere). Found: the "Responses at a glance" cards and
  the full provenance/agreement-map panel restored perfectly (this data comes straight from the
  saved turn), but the per-model tab bar showed ONLY "Consensus" — no Claude/Gemini/ChatGPT
  tabs at all — and clicking a response card's "Full reply" link called `switchTab()` on a tab
  that was never created, which deactivated the Consensus tab too and left a completely blank
  panel with no visible way back except starting a new chat. Root cause: `restoreThread()`
  (`js/app.js`) calls `ensureTabs()` with no arguments, which builds tabs from `sels()` —
  `answeringSelections(cfg)` — the same currently-configured-key-gated list used to decide who
  receives a *live* prompt. That gating is correct for sending, but restoring a *past* chat
  should show what actually answered then, regardless of whether the browser has since lost
  the key. Fixed by giving `ensureTabs()` an optional explicit selection-list parameter
  (defaulting to `sels()` everywhere else, so live sending is untouched) and having
  `restoreThread()` pass `cfg.selections` — the thread's own selections — so tabs/panels are
  always built for every model a restored chat actually talked to. Verified in headless
  Chromium: with no keys configured, a restored 3-model thread now shows all three model tabs
  plus Consensus, and clicking a response card opens the right tab with the full saved reply
  instead of a blank screen; re-verified the ordinary live-send path (Free demo, 2 models)
  still only builds tabs for models that can actually answer, unchanged; zero console errors
  in either path.
- [x] **IA cleanup (FIXED 2026-07-03, 13:55 CT): "Clear all keys" showed on every Settings tab,
  not just Keys.** With the roadmap still fully checked off, ran a fresh headless-Chromium
  session (Playwright + system chromium) driving Settings across all three tabs (Models &
  Consensus, Keys, Support) instead of another code-only sweep. Screenshotted each tab's footer:
  the destructive "Clear all keys" button rendered in the shared `.modal-foot` (`index.html`),
  so it appeared identically on the Models tab and the Support tab too — completely out of
  context on both, and a beginner glancing at "Models & Consensus" would see an unrelated
  destructive key-management action sitting in the footer for no visible reason. Root cause:
  `#clearKeys` lived in the modal's global footer alongside "Tour" and "Done" (which genuinely
  are global actions), rather than inside the Keys tab's own section content. Fixed by moving
  the button into `#sec-keys`, directly below the existing "Keys live in your browser's
  localStorage..." security note, sized with a new small `.btn-sm` helper class (extracted from
  the footer-only `.foot-left .btn` rule so it's reusable) and `align-self:flex-start` so it
  doesn't stretch to the full flex-column width of the tab section. No JS changes needed — the
  `$('clearKeys').onclick` handler and its confirm-dialog logic (`js/app.js`) were untouched, only
  the button's location moved. Verified in headless Chromium (desktop + 390px mobile, light +
  dark): Models and Support tabs' footers now show only "Tour"/"Done"; the Keys tab shows "Clear
  all keys" as a compact, left-aligned red link at the end of its content, functions identically
  (confirm dialog fires, keys clear), zero console errors.
- [x] **BUG (FIXED 2026-07-03, 12:56 CT): the Keyboard shortcuts panel rendered blurry when opened
  from the sidebar.** With the roadmap still fully checked off, ran a fresh headless-Chromium
  session (Playwright + system chromium) instead of another code-only sweep, opened the sidebar
  and clicked "Shortcuts", and screenshotted the result: every line in the panel — the title, the
  section labels, the kbd keys, the descriptions — rendered visibly out of focus, unlike every
  other modal (Settings, Compare, Export) which stayed crisp under the same audit. A pixel-level
  crop confirmed genuine Gaussian blur on the text edges, not a color-contrast issue (a different
  bug class than the low-contrast fix directly below this one). Re-tested opening the same panel
  via the `?` keyboard shortcut with the sidebar closed: perfectly crisp — isolating the bug to
  the sidebar-triggered path specifically. Root cause: `.sidebar-backdrop` (`css/styles.css`) sits
  at `z-index: 240` and the sidebar itself at `250`, both above the shortcuts panel's `.backdrop`
  at `z-index: 200` — the exact same stacking bug already found and fixed for Settings (see the
  `openConfig()` comment: "opening Settings from the sidebar's own link left its higher z-index
  backdrop covering the modal"), just never applied to the Shortcuts link. `openConfig()` and
  `startFreeDemo()` both already call `closeSidebar()` before opening their overlay; `openKbd()`
  (`js/app.js`) was the one remaining sidebar-launched overlay using the generic `.backdrop` class
  that didn't. Export and What's New were checked too but use a different overlay class
  (`.exp-overlay`, `z-index: 500`) that already sits above the sidebar, so they were never
  affected. Fixed with the same one-line `closeSidebar()` call at the top of `openKbd()`. Verified
  in headless Chromium: the panel now renders pixel-crisp when opened from the sidebar, the
  sidebar itself closes (matching the Settings/free-demo precedent), and the `?`-key path and
  Esc-to-close both still work unchanged; zero console errors.
- [x] **POLISH (FIXED 2026-07-03, 12:00 CT): low-contrast text in the empty-state hint and the
  keyboard-shortcuts panel.** With the roadmap still fully checked off, ran a headless-Chromium
  audit pass (Playwright + system chromium) across the empty state, sidebar, settings tabs, and
  the keyboard-shortcuts cheatsheet (desktop, mobile, light + dark). The shortcuts modal in
  particular looked visibly "washed out" next to every other modal. Root cause: `.cg-hint` (the
  "Pick a question to try it — or type your own" line under the free-demo suggestion chips),
  `.kbd-group-label` (the COMPOSING/NAVIGATION/ACTIONS section headers), and `.kbd-plus`/`.kbd-sep`
  (the "+" between keys like Cmd+Enter) all used `var(--text-3)`, which computes to roughly a
  2.2:1 contrast ratio against `--surface`/`--bg` in dark mode — well under WCAG AA's 4.5:1 floor
  for normal-size text, and the reason the shortcuts panel read as hazy. Fixed by switching those
  three rules to `var(--text-2)` (already ~5.5:1, the same color the adjacent suggestion chips and
  kbd-row labels already use) — verified via computed-style checks and before/after screenshots.
  **Not done (deliberately out of scope, flagged for a future dedicated pass):** `var(--text-3)`
  itself is used for ~90 other rules across the stylesheet, many purely decorative (borders,
  bullets, disabled icons) where the dim contrast is fine, but some — e.g. `.sb-section-label`
  ("HISTORY" in the sidebar), `.prov-section-label` (agreement-map section headers), `.msg-label`
  ("YOU" / model name above each message), `.arb-plabel` — are informational text with the same
  ~2.2:1 problem. A full fix needs a token-level look (the dark palette leaves very little room
  between "meets 4.5:1" and `--text-2` itself) plus per-screen visual verification, not a
  single-run mechanical swap; tracked here so it isn't lost.
- [x] **POLISH (FIXED 2026-07-03, 15:01 CT): closed out the low-contrast follow-up flagged above.**
  Switched the four named informational labels — `.msg-label` ("YOU"/model name), `.arb-plabel`
  (arbiter prompt-editor field labels), `.sb-section-label` ("HISTORY"), and `.prov-section-label`
  (agreement-map section headers, e.g. "CONTRIBUTION") — from `var(--text-3)` (~2.2:1 in dark mode)
  to `var(--text-2)` (~5.5:1, passes WCAG AA). Also caught `.sb-date-group` (the "TODAY"/"YESTERDAY"
  sidebar date dividers, sitting directly under `.sb-section-label` in the same list) since leaving
  it dim next to a now-crisp "HISTORY" header would have read as an inconsistency, not a fix. The
  other ~85 `var(--text-3)` uses (borders, placeholders, disabled icons, decorative bullets) were
  deliberately left alone — still fine at low contrast, and the prior run's note about needing a
  token-level look for a *full* sweep still stands if more informational-text cases turn up later.
  Verified in a real headless-Chromium session: seeded a synthetic 3-model consensus thread with a
  full provenance payload into `polecat_history`, opened the sidebar (HISTORY/date labels crisp),
  and restored the thread (YOU/model-name labels and the CONTRIBUTION panel label crisp), dark mode,
  zero console errors.
  **Bonus bug found while seeding that same verification data:** the "Responses at a glance"
  preview cards under a consensus answer mangled any model reply that opened with a plain number,
  e.g. a reply starting "2001: A Space Odyssey..." rendered as ": A Space Odyssey...". Root cause:
  `plainPreview()`'s (`js/app.js`) leading-marker-stripping regex `/^[-*•>|\d.)]+\s*/` was meant to
  strip markdown list markers ("1. ", "- ", "> ") but its character class matched bare digits too,
  so it ate "2001" even with no list-marker context. Same bug would hit "42 is the answer" (→ "is
  the answer") or "3.14 is pi" (→ "is pi, roughly"). Fixed by requiring an actual marker shape —
  `/^(?:[-*•>]\s+|\d+[.)]\s+)/` — which still strips real list items ("1. Point" → "Point", "1)
  Point" → "Point") but leaves plain leading numbers untouched. Verified with unit-style checks on
  7 cases (list markers still strip, plain numbers/decimals no longer do) and confirmed in the same
  headless-Chromium session via the seeded consensus thread's preview card.
- [x] **BUG (FIXED 2026-07-03, 11:19 CT): reopening a saved consensus chat left the tab-bar
  agreement badges blank.** With the roadmap still fully checked off, seeded a synthetic
  3-model consensus thread (with a full provenance payload) straight into `polecat_history`
  and drove it through a real headless-Chromium session (Playwright + system chromium) to
  exercise the restore path without needing live API calls. The rich "How this was formed"
  panel, snapshot cards, inline attribution toggle, and side-by-side compare modal all
  restored correctly (prior runs already fixed those) — but the tab bar itself did not: each
  model tab's small "aligned/partial/outlier" stance badge and the Consensus tab's own
  "strong/mixed/diverse" agreement pill stayed hidden after reopening a chat from the
  sidebar, even though the exact data needed to show them (`turn.provenance`) was right
  there and the same-session live panel proved it parses fine. Root cause: that badge-setting
  logic lived only inline inside the live-only `onProvenance()` handler (`js/app.js`); `restoreThread()`
  never called it, and only replicated the OTHER provenance-driven renders (snapshot cards,
  follow-up chips, re-synthesis strip, panel, inline attribution) — an omission of the same
  shape as the two provenance-restore bugs fixed earlier (see the entries below), just for a
  piece those fixes did not touch. Fixed by extracting the badge logic into a shared
  `applyTabBadges(prov)` and calling it from both `onProvenance()` and `restoreThread()`
  (right after `lastConsensusProvenance` is repopulated from `lastTurn.provenance`). Verified
  in headless Chromium: badges are hidden on a fresh chat, appear correctly on restore
  ("aligned" x3 + "strong"), and correctly clear again on "New chat" — zero console errors.
- [x] **BUG (FIXED 2026-07-03, 10:10 CT): Models & Consensus flow pills showed duplicate,
  indistinguishable labels when 2+ selected models shared a provider.** With the roadmap
  still fully checked off, ran a fresh headless-Chromium session (Playwright + system
  chromium, desktop + mobile) driving Settings -> Models & Consensus instead of another
  code-only sweep: added three Free demo models (Llama 3.3 70B, Gemma 4 31B, GPT-OSS 120B)
  via the picker and screenshotted the flow-pill row at the top of the tab — the exact
  "who answers -> who writes the final answer -> Consensus" summary that the whole
  "Rethink the Models + Consensus screens" theme (see DO THIS NEXT item 3, now closed) was
  built to make legible at a glance. All three answerer pills read identically: "Free demo",
  "Free demo", "Free demo" — zero information about which distinct models were selected.
  Root cause: `consensusFlowPills()` (`js/app.js` ~3006) labelled each answerer pill with
  `PROVIDERS[s.provider].short` (the provider's short name only), while every other place
  in the app that lists selections side-by-side — composer chips (`buildChips()`), response
  tabs (`ensureTabs()`), and the flow row's own arbiter/final-answer pill — already use
  `selectionLabel(s)` ("Provider · Model", e.g. "Free demo · Llama 3.3 70B"), so this was an
  inconsistency, not a deliberate design choice. This is a realistic scenario, not an edge
  case: the free demo's own onboarding starts users with 2 same-provider models, and
  cost-conscious users comparing several free models on one provider (OpenRouter, Groq, HF)
  is a core use case. Fixed by swapping `p.short` for `selectionLabel(s)` (one line). Verified
  in a real headless-Chromium session (desktop + 390px mobile, light theme, after reordering
  models and toggling "Final answer" on a different row): pills now read "Free demo · Gemma 4
  31B", "Free demo · Llama 3.3 70B", "Free demo · GPT-OSS 120B", update live with reorder/
  final-answer changes, and wrap cleanly on mobile with no overflow; zero console errors
  throughout the session.
- [x] **BUG (FIXED 2026-07-03, 09:04 CT): the Keys tab's "No key? Try it free." card kept
  pitching the free demo even after it was already active.** With the roadmap still fully
  checked off, ran a fresh headless-Chromium session (Playwright + system chromium, desktop
  + mobile) driving the free-demo flow end-to-end instead of another code-only sweep: clicked
  "Try it free" from the empty-state composer button (`#cgTry`), then opened Settings -> Keys.
  Screenshot showed the exact same "No key? Try it free. Run a free model through Polecat right
  now — no signup, no key." card and "Try it free — no setup" button as before starting the
  demo, even though 2 free demo models were already selected and answering. Root cause:
  `renderKeys()` (`js/app.js` ~2952) rendered this card unconditionally whenever
  `PROVIDERS.demo` existed, unlike the composer's own `#cgTry` button a few hundred lines away
  which already computes `demoActive = (cfg.selections||[]).some(s => s.provider === 'demo')`
  and hides itself once true — the Keys-tab card just never got the same treatment. Beginner
  impact: a first-timer who already tried the demo would see Settings telling them to do the
  same thing again, with no acknowledgment they'd succeeded — confusing, not reassuring. Fixed
  by computing the same `demoActive`-style check (`demoCount`) in `renderKeys()` and branching:
  when 0 demo models are selected, the card is unchanged; when 1+ are active, it now reads
  "Free demo is active" (with the existing `CHECK_SM_SVG` checkmark instead of the star), "You're
  already using N free demo model(s) — no key needed. Add your own free key below for unlimited
  use & more models.", and the button becomes "Manage models ->" which calls `setConfigTab('models')`
  instead of `startFreeDemo()` (re-running `startFreeDemo()` while already active would have
  redundantly closed Settings and re-shown the "Free demo ready" toast — confirmed the tab-switch
  is the correct, non-redundant action instead). Verified in headless Chromium at both desktop and
  390px mobile, light theme: card correctly shows the active state with the right count (2),
  clicking "Manage models ->" switches to the Models & Consensus tab and shows both demo model
  rows, zero console errors. The inactive (0 demo models) state was also re-verified unchanged.
- [x] **BUG (FIXED 2026-07-03, 08:08 CT): toast messages could overflow off both edges
  of the screen on mobile.** With the roadmap still fully checked off, ran a fresh
  headless-Chromium session (Playwright + system chromium, touch-emulated 390px mobile
  context) exercising the free-demo flow instead of another code-only sweep. Measured
  `#toast`'s `getBoundingClientRect()` right after `startFreeDemo()`'s "Free demo ready —
  pick a question below or type your own" toast fired: width 419px against a 390px
  viewport, positioned from x:-14.7 to x:404.7 — i.e. overflowing by ~15px on both the
  left and right edges simultaneously (centered via `left: 50%; transform:
  translateX(-50%)`), which clips off the pill's rounded corners and side padding on
  both sides. Root cause: `.toast` (`css/styles.css`) set `white-space: nowrap` with no
  `max-width`, so any message long enough to exceed the viewport at 13px/500-weight font
  simply ran past both screen edges — affects several real toasts, not just the demo
  one, e.g. the iOS install-hint ("Tap the Share icon, then \"Add to Home Screen\"", 6s
  duration) and the synthesis-only-guard warning. Fixed by adding `max-width: min(420px,
  calc(100vw - 32px))` and switching `white-space: nowrap` to `normal` + `text-align:
  center`, so long messages wrap onto 2-3 lines and stay fully on-screen at any viewport
  width; `border-radius: 100px` still renders correctly on the taller wrapped box since
  CSS auto-caps corner radius at half the box's own height. Verified in headless
  Chromium: the same free-demo toast now measures 195px wide, fully within the 390px
  viewport, rendered as a proper multi-line pill; on desktop (1400px), a short toast
  ("Copied") stays a compact single-line pill and a long one (the synthesis-only
  warning) wraps at the new 420px cap instead of stretching edge to edge — zero visual
  regression to the common case, zero console errors.
- [x] **BUG (FIXED 2026-07-03, 07:06 CT): adding a Free demo model showed a misleading
  "add a key" toast.** With the roadmap still fully checked off, ran another real
  headless-Chromium session (Playwright + system chromium) driving Settings -> Models &
  Consensus: added the default Free demo model, then added a second Free demo model
  (GPT-OSS 120B) via the provider/model pickers + Add button. Screenshot showed a toast
  reading "Added -- add a Free demo key to use it" -- but the Free demo provider is
  explicitly keyless (its key lives server-side in the Cloudflare proxy; `KEY_TIER.demo`
  is literally `'Free · no key'`, and `js/config.js` already special-cases
  `s.provider === 'demo' || providerKey(...)` when deciding which selections can answer).
  Root cause: `addModel()` (`js/app.js` ~2900) only checked `providerKey(cfg, provider)` to
  decide between auto-testing the model and showing the "add a key" toast -- it never
  special-cased `demo` the way every other keyless-aware code path in the file already
  does, so `providerKey(cfg, 'demo')` correctly returned falsy (no key is ever stored for
  demo) and fell into the toast branch every time. Fixed with a one-line guard
  (`else if (provider !== 'demo') toast(...)`), matching the existing special-case pattern
  used elsewhere in the same file. Verified in headless Chromium: adding one or two Free
  demo models now shows no toast at all (they just work, both rows green/"Final answer"),
  zero console errors; non-demo providers without a key still show the original helpful
  toast unchanged.
- [x] **BUG (FIXED 2026-07-03, 06:19 CT): three more elements stuck in the same "hidden has no
  effect" bug class as the sidebar nudge two runs ago.** With the roadmap still fully checked
  off, ran another real headless-Chromium session (Playwright + system chromium) driving the
  actual app instead of a code-only sweep -- walked the welcome carousel, empty state (desktop +
  mobile touch), sidebar, light/dark theme, and Settings -> Models & Consensus with models
  added/reordered/set as final-answer -- all clean, zero console errors, until adding a model
  revealed the "Search models..." input rendering open, unprompted, directly under the "Browse
  all models" button on first view of the tab (confirmed via a screenshot, then via
  `getComputedStyle`: `#browsePanel` had `hidden: true` set correctly by JS but a computed
  `display: flex`, with `offsetHeight: 59` -- i.e. actually visible on screen despite the
  attribute). Root cause: identical bug class to the sidebar-nudge fix two runs ago (2026-07-03,
  00:46 CT) -- `.browse-panel` (`css/styles.css`) declares its own `display: flex` with no
  `[hidden]` override, and an author stylesheet's normal `display` always beats the browser's
  built-in `[hidden] { display: none }` UA rule, so `element.hidden = true`
  (`js/app.js` `openBrowse`/provider-change handler) had zero visual effect. That prompted a
  targeted sweep (grep every CSS class with a `display:` declaration, cross-referenced against
  every element toggled via `.hidden =` in `js/app.js`) rather than stopping at one instance, which
  turned up two more real, currently-live instances: `#browseBtn` (`.browse-btn { display:
  inline-flex; }`) -- `modelListSupported()` correctly set `hidden = true` for providers without a
  live model catalog (e.g. Claude, Gemini, GPT -- only OpenRouter/Groq/HF/OpenAI-compatible
  providers with a `baseUrl` support it), but the button rendered anyway, so clicking it on an
  unsupported provider just produced a "No live list for this provider" toast instead of the
  button correctly not being there; and `#attachStrip` (`.attach-strip { display: flex; padding:
  12px 12px 0; }`) -- with zero attachments `renderAttachments()` sets `strip.hidden = true`, but
  the empty flex box's top padding still rendered a permanent ~12px gap above the composer
  (confirmed: `offsetHeight: 12` with `hiddenAttr: true`) on every screen, always, whether or not
  any file was ever attached. The sweep also checked two elements that share the same `hidden`-
  toggle + `display:` shape (`.msg-time`, `.copy-btn` in every model response's header) but
  confirmed via `getBoundingClientRect()` they already collapse to a genuine 0x0 box before their
  content is set (they're flex *items* inside `.msg-head`, which blockifies and shrinks empty
  children to nothing) -- so despite the same latent CSS gap, there is no actual visible/clickable
  regression there today; left alone rather than making a speculative change with no observed
  failure to fix, per the standing "fix real, demonstrated bugs" bar. Fixed the three confirmed
  ones with the same one-line-per-selector pattern as the earlier fix: `.browse-btn[hidden]`,
  `.browse-panel[hidden]`, `.attach-strip[hidden] { display: none; }`. Verified in headless
  Chromium: for the Free demo provider (which does support a live list), the browse panel now
  starts closed and opens correctly on clicking "Browse all models" (showing a graceful "Couldn't
  load: Failed to fetch" in this network-sandboxed test environment, not a crash); for Claude, the
  "Browse all models" button no longer renders at all; the empty-attachments strip now measures
  `display: none` / `offsetHeight: 0` on a fresh load. Zero console errors, zero regressions to
  add-model/reorder/final-answer flows verified in the same session. Flagging for a future pass:
  the `.msg-time`/`.copy-btn` latent gap noted above is safe today only because of the specific
  flex-shrink layout it sits in -- if that layout ever changes (e.g. a fixed min-width or a
  non-flex wrapper), it would silently become the same bug; worth adding the defensive
  `[hidden]` override preemptively next time either of those rules is touched for something else.
- [x] **Bug fix (2026-07-03, 05:45 CT): composer placeholder hint could be visually clipped.**
  With the roadmap still fully checked off, ran a real headless-Chromium session (Playwright +
  system chromium, a proper touch-emulated mobile context this time, not just a narrow desktop
  viewport) instead of another code-only sweep. Measured `#promptInput`'s `clientHeight` vs
  `scrollHeight` on load: on a 390px touch device, `scrollHeight` (90px, driven by the two-line
  placeholder hint) exceeded `clientHeight` (73px, the textarea's `min-height`), so the second
  line of the hint ("Tap to send... attach images or text files") was cut off at the bottom
  edge -- confirmed visually in a screenshot. Root cause: the auto-grow-to-content logic
  (`el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'`) was
  duplicated across 5 call sites in `js/app.js`, but two of them -- app init (right after the
  placeholder is set) and the post-send composer clear -- only did the `height = 'auto'` half
  and never recomputed from `scrollHeight`, so the box stayed pinned at the bare CSS
  `min-height` instead of fitting the placeholder. The three sites that already called both
  lines (typing, prompt-history recall via arrow keys, draft restore) were never affected.
  Extracted the duplicated two-liner into one `autoGrowComposer(el)` helper and used it at
  all 5 sites, including the 2 that were missing the fix -- so the composer now always sizes
  itself to its content or placeholder, consistently, from a single source of truth. Verified
  in headless Chromium: mobile touch context now reports `clientHeight === scrollHeight` (90px,
  hint fully visible) on load, after typing then clearing, and desktop/light theme unaffected.
- [x] **Icon-consistency polish (2026-07-03, 04:39 CT): model reorder buttons used raw
  Unicode triangles instead of the app's SVG icon language.** With the roadmap still fully
  checked off, ran a fresh interactive headless-Chromium audit (desktop + 390px mobile,
  light + dark, welcome flow, Keys tab, Models & Consensus tab with 2 models added, Browse
  all models, Test models) instead of another code-only sweep -- everything held up
  (zero console errors, graceful "Couldn't load"/CORS-blocked states from this sandbox's
  network restrictions, correct light/dark rendering) except one visual inconsistency: the
  per-model move-up/move-down buttons in Settings -> Models & Consensus (`js/app.js`
  `renderSelList`, `.sel-mv`) rendered as raw HTML entities `&#9650;`/`&#9660;` (tiny
  browser-default triangles at `font-size: 7px`), the only spot left using a plain glyph
  instead of the app's consistent 24x24 `currentColor`/~2px-stroke SVG icon set that EPIC 3
  established everywhere else (copy/share/expand/close/etc.). Added two small SVG chevrons
  (`CHEVRON_UP_SM_SVG`/`CHEVRON_DOWN_SM_SVG`, matching the existing `EXPAND_SVG`/
  `CHECK_SM_SVG` sizing convention) and swapped them in; updated `.sel-mv` (`css/
  styles.css`) to flex-center the SVG instead of sizing a text glyph. No behavior change --
  same buttons, same disabled/hover states, same click handlers. Verified in headless
  Chromium at both viewport sizes and both themes: crisp chevrons, correct disabled dimming
  on the first/last row, zero console errors.
- [x] **Robustness pass (2026-07-03, 02:39 CT): app could crash if a saved selection
  referenced an unknown provider.** With the roadmap still fully checked off, ran a
  fresh headless-Chromium session (Playwright + system chromium) exercising the empty
  state, sidebar, settings, and light/dark/mobile -- all looked clean -- then dug into
  `js/app.js` for defensive gaps around `PROVIDERS[sel.provider]` lookups, since one spot
  (`renderSelList`) already guarded with `if (!p) return;` while others didn't, suggesting
  an inconsistency rather than a deliberate invariant. Confirmed the gap is real: with a
  saved provider key + a selection referencing a provider id not in the `PROVIDERS`
  catalog (e.g. a stale id from an old import, or a future catalog change), five
  unguarded `.color`/`.models` accesses threw a synchronous, uncaught `TypeError`
  ("Cannot read properties of undefined (reading 'color')") from inside core render
  paths -- `buildChips()` (composer chips), `ensureTabs()` (response tabs),
  `refreshConsensusProgress()` (the "Building consensus" list), `consensusSourcesEl()`
  (the consensus sources bar), and `testAllModels()` -- breaking the composer for that
  session (verified: the "no models selected" hint and Add-model control silently
  vanished mid-render). All five now fall back to a neutral gray dot (`'#888'`, matching
  the fallback already used in ~8 other spots in the same file) instead of crashing.
  Verified via a real headless-Chromium repro: staged a provider key + selection for a
  nonexistent provider id, confirmed the crash on the pre-fix code (console:
  "Cannot read properties of undefined (reading 'color')", composer chip row missing),
  then confirmed a clean render with zero console errors after the fix (composer shows
  a gray-dot fallback chip for the unrecognized model, everything else intact). No
  behavior change for any valid/current selection.
- [x] **BUG (FIXED 2026-07-03, 00:46 CT): sidebar nudge banners were always visible to
  everyone, not conditional at all.** With the roadmap still fully checked off, drove a
  fresh headless-Chromium session (Playwright + system chromium) to visually audit the
  empty state, sidebar, and settings — a check the previous audit passes had done via
  code-reading only, not by actually rendering the page. Found: `#sbIosInstallHint` and
  `#sbBackupNudge` (`css/styles.css` `.sb-backup-nudge`, shared by both) had `display: flex`
  with no matching `.sb-backup-nudge[hidden] { display: none; }` override — every other
  conditionally-shown element in the file (`.cg-try[hidden]`, `.cg-hint[hidden]`,
  `.tab-agree-badge[hidden]`, `.tab-stance[hidden]`) has this pairing, but this one was
  missing it. Since an author stylesheet's normal `display` declaration always beats the
  browser's built-in `[hidden] { display: none }` UA rule regardless of selector
  specificity, `element.hidden = true` had ZERO visual effect — both banners rendered on
  every single sidebar open, for every user, on every device, from the moment the backup
  nudge shipped (2026-07-01) and the iOS hint shipped (2026-07-02), regardless of platform,
  data-at-risk, or dismissal state. Verified in headless Chromium: before the fix, a
  brand-new non-iOS session with zero chats/keys showed both banners stacked in the
  sidebar; after adding the one-line CSS override, the same fresh session shows neither,
  while a seeded iOS UA + 20-day-old + configured-key session still correctly shows just
  the iOS hint (and correctly suppresses the backup nudge to avoid stacking, per existing
  logic). One-line CSS fix, zero JS/logic changes needed — the gating logic itself was
  always correct.
- [x] **Periodic audit pass (2026-07-02, 11:02 CT): all epics/backlog still fully checked
  off, so ran a fresh code-based accessibility/dead-code sweep.** Found and fixed: (1) three
  `copy-btn` templates (`js/app.js` ~875, ~1591, ~3391) had a `title` tooltip but no
  `aria-label`, unlike their Share/Copy-as-markdown siblings in the same row — added
  `aria-label="Copy"` to all three; (2) four confirmed-dead CSS rules left over from earlier
  redesigns (`css/styles.css` `.cfg-link`, `.cs-flow-wrap`, `.key-vendor`, `.arb-meta` — verified
  zero references anywhere in `index.html`/`js/*.js`) removed. Also shipped a small website pass
  (Part 2): added Twitter Card meta tags + a canonical link to polecat.live's `<head>` for proper
  link previews on X/Slack/Discord (previously only Open Graph tags existed). Flagging for the
  next run: still open from this pass but intentionally deferred — small tap targets on
  `.copy-btn`/`.ms-copy-btn`/`.ms-expand-btn` (well under the 44px mobile guideline; needs a
  wider audit of hover/hit-area padding across call sites to fix safely) and a one-word CTA
  copy mismatch ("Try it free — no key needed" vs "Try it free now — no key needed",
  `index.html` composer greeting vs welcome carousel).
- [x] **Both deferred items above fixed (2026-07-02, 12:01 CT).** `.copy-btn`, `.ms-copy-btn`,
  and `.ms-expand-btn` now use `padding: 6px; margin: -4px` (was `padding: 2px`), which grows
  the clickable padding-box from ~17px to ~25px while a matching negative margin keeps the
  visual layout footprint unchanged (no shift, no reflow) — verified via a real headless-
  Chromium session that adjacent buttons in both the `.msg-head` row (8px gap) and the tighter
  `.ms-card-head` row (6px gap) don't meaningfully overlap (worst case ~2px at the shared edge
  in the tightest row), and that the welcome carousel's slide-5 CTA now reads "Try it free — no
  key needed", matching the empty-state button exactly. Zero console errors, screenshots
  confirmed at desktop and 390px mobile, light and dark.
- [x] **Periodic audit pass (2026-07-02): every DO THIS NEXT item, all 3 epics, and the
  entire backlog were fully checked off with no unchecked steps remaining.** Ran a
  code-based icon/emoji/copy audit in lieu of a specific next step (found and fixed one
  stray non-SVG glyph — see changelog "Tidied up a stray icon in the welcome tour"). No
  other emoji/inconsistent-icon or missing-aria-label issues found on this pass. Flagging
  here so the next run knows the roadmap is caught up and should either open a new epic
  or do another best-practice audit.
- [x] **Bug fix pass (2026-07-02, 22:29 CT): regenerate skipped template-token cleanup.**
  With the roadmap still fully checked off, did a fresh code read of the response-streaming
  paths instead of another cosmetic audit. Found: `cleanModelText()` (`js/app.js` ~893) strips
  chat-template leakage (`<|start|>`, `<|im_start|>`, `<|eot_id|>`, `<s>`/`</s>`) that some
  free-demo/self-hosted models emit, and is applied on every response path (`streamTo`,
  `getSilentText`, `streamToConsensus`) EXCEPT the per-model regenerate button's handler
  (`regenModel`, ~1018) -- its streaming loop and final text were never cleaned. Beyond the
  cosmetic issue, the uncleaned text also landed in `results[sel.id]`, which feeds the NEXT
  consensus/arbitration run's agreement computation and provenance -- so a regenerated answer
  could silently pollute the cross-model agreement analysis, not just its own display. Fixed by
  cleaning inside the streaming loop and before `finishBubble`/`co.push`/`results[sel.id]`,
  matching the existing pattern in `streamTo`. Considered also porting `streamTo`'s
  Stop-mid-stream handling into `regenModel` for symmetry, but confirmed the Stop button/
  `_runCtrl` abort controller is only wired up during `sendAll()`'s multi-model run, not during
  a single-model regenerate -- so that branch would have been dead code; left `regenModel`'s
  existing (simpler) catch block alone rather than adding unreachable complexity.
- [x] **Polish pass (2026-07-02, 14:53 CT): consensus flow explainer grammar bug +
  keyboard focus rings.** With the roadmap still fully checked off, ran a targeted
  exploration of the Models & Consensus tab and provenance panel. Found and fixed: (1)
  `consensusFlowSentence()` (`js/app.js`) produced broken grammar when exactly 1 model
  answers ("Your 1 model answers in parallel, then X merges them into one answer") —
  reachable via the "Synthesis only" checkbox leaving just one answerer; now reads "Your
  1 model answers, then X turns it into the final answer" for n=1, unchanged for n>1; (2)
  the three most important toggles in the app (`#consensusSwitch`, `#provSwitch`,
  `#privateSwitch` — gating the multi-model differentiator itself) plus the provenance
  panel's model-name links and "Ask about this" buttons had no `:focus-visible` styling,
  unlike sibling custom controls (`.ms-card`, `.ms-copy-btn`) — added a brand-colored
  focus ring to `.switch` and hover-matching focus states to `.prov-model-link`/
  `.prov-ask-btn` (`css/styles.css`). Both are small, isolated, and on the first-impression
  consensus-explainer path. Flagging for a future run: `startFreeDemo()`'s
  `DEMO_STARTER_MODELS` (`js/app.js`) is hardcoded against `PROVIDERS.demo.models`
  (`js/providers.js`) with no assertion tying them together — currently in sync, but a
  future catalog edit could silently desync them; low priority, not a live bug.
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
  - [x] **Proactive arbiter-health warning (shipped 2026-07-02).** The Consensus tab now
    shows a one-line amber warning right under "Final answer written by" the moment an
    explicit (non-auto) final-answer model has no key or a known-bad one — instead of only
    finding out after synthesis silently falls back. Two signal sources feed it, both reusing
    the existing `modelStatus` cache (`js/app.js` `statusOf`/`providerKey` — no new network
    probe added just to render Settings): (1) a manual Models/Keys-tab test, same as before;
    (2) NEW — a live consensus run's actual arbiter call failing is itself now recorded as a
    probe result (`js/arbitration.js` `runChain`/`runJudge`/`runDebate` catch blocks now call
    an optional `ctx.arbiterFailed(selection, error)`, wired in `js/app.js` to
    `recordArbiterHealthFailure()`), so a real failed run also arms the warning for next time,
    not just a manual test. While fixing this, found and closed the staleness gap it would
    otherwise have had: the warning (and the arbiter `<select>`'s own option list) previously
    only refreshed on a full Settings close/reopen, so fixing a key on the Keys tab or
    adding/removing/reordering a model on the Models tab left the Consensus tab showing stale
    info until reopened. `renderModels()` and `refreshModelBadges()` now also call
    `renderArbitration()` (guarded, cheap re-render of a hidden panel), and `scheduleKeyProbe()`
    calls it at each status transition, so everything stays in sync live within one session —
    the same "never goes stale while Settings is open" bar set by the earlier synthesis-only
    badge fix. Verified in real headless-Chromium sessions: no-key warning appears/disappears
    live as a model is added/removed/picked as arbiter, key-probe failure updates the warning
    without reopening Settings, reorder/add/remove via Models tab keeps the Consensus tab's
    arbiter dropdown in sync, zero console errors throughout.

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
- [x] **Rethink the Models + Consensus screens so model ROLES + the consensus flow are obvious
  (operator-requested 2026-06-30).** STRUCTURAL PASS DONE (2026-07-02): the Settings modal's
  separate "Models" and "Consensus" tabs are now ONE tab, "Models & Consensus". The Consensus
  tab's controls (`#arbControls`: strategy, agreement-map switch, "Final answer written by"
  picker, synthesis-only checkbox, prompt templates) now live directly inside the Models tab,
  right below the model list, under a plain "How the combined answer is formed" divider/heading
  (`index.html` `#sec-models`, `js/app.js` `renderArbitration`). This was the last open piece of
  the theme: by this point both tabs already showed an identical flow-pills + plain-language
  sentence (from earlier steps below) and cross-linked to each other, which made having them as
  two separate tabs feel redundant rather than helpful — a user had to flip tabs to see one
  unified story. Now it's one screen, top to bottom: who answers (model list) -> how the answer
  is combined (strategy/arbiter controls) -> nothing left to cross-link. Removed the now-dead
  cross-tab links ("...is set in the Consensus tab ->", "Manage models ->") and the duplicate
  flow-pills render that used to repeat inside `renderArbitration()` (the single copy at the top
  of the merged tab, from `renderModelsFlow()`, now covers both). `VALID_TABS` dropped
  `'consensus'`; a stale saved `cfg.ui.lastTab: 'consensus'` from before this change harmlessly
  falls back to the Models tab. Settings now has 3 tabs total: Models & Consensus, Keys, Support.
  Verified in a real headless-Chromium session (desktop + 390px mobile): exactly 3 tabs, correct
  content order, consensus on/off + strategy + "Final answer" (Models-tab button) + synthesis-only
  all still work and stay in sync, zero console errors, no mobile overflow. This closes out the
  theme — see the step-by-step history below for the cross-linking/jargon work that preceded it.
  FOLLOW-UP (2026-07-02): a periodic best-practice pass driving the merged tab in a real
  headless-Chromium session (light + dark + mobile) found the phrase "how the combined answer is
  formed" appeared twice on the same screen — once in the tab subtitle, once as the section
  heading above the strategy/arbiter controls, a copy-paste leftover from the merge. Retitled the
  section heading to "Combining into one answer" so the two labels read as complementary instead
  of duplicated.
  PARTIALLY DONE (2026-07-01): the Consensus tab now opens with
  a pill flow ([answering models] → [arbiter] → [Consensus]) + a plain-language sentence, and both
  tabs cross-link to each other. The "synthesis only" (arbiter-only) badge/control is now unified
  across both tabs too (2026-07-01) — a matching checkbox lives on the Consensus tab next to the
  arbiter picker, the flow pill tags the arbiter chip " · synthesis only" when set, and toggling
  either tab's checkbox live-updates the other (previously the Models tab's toggle didn't refresh
  the Consensus tab, so its dropdown/flow could show stale state until Settings was reopened).
  The "arbiter" jargon itself is now swept from user-facing copy too (2026-07-01, see DO THIS
  NEXT item 3 step 6 above) — the Consensus tab's selector is "Final answer written by" and the
  Models tab's toggle is "Final answer". VISUAL FLOW ON MODELS TAB DONE (2026-07-01): the same
  "[answering models] → [final-answer model] → Consensus" pill flow that opened the Consensus tab
  now also renders at the top of the Models tab (`js/app.js` `renderModelsFlow`, `#modelsFlow` in
  `index.html`), so a user managing the model list sees the whole shape of a run — who answers and
  who writes the final answer — without switching tabs. The pill markup itself was extracted into
  one shared `consensusFlowPills()` helper used by both tabs, so the two can't drift out of sync
  the way the "synthesis only" badge did before it was unified. It refreshes live on every action
  that changes the answering set or the arbiter (reorder, remove, add via picker or browse, toggle
  "Final answer", toggle "Synthesis only" from either tab) and stays empty/hidden when there are no
  models yet (the existing "No models yet" hint already covers that case). Verified in a real
  headless-Chromium session (desktop dark, mobile-width light, before/after setting an arbiter) —
  pills matched exactly between tabs, wrapped cleanly at 390px, zero console errors. PLAIN-LANGUAGE
  SENTENCE ON MODELS TAB DONE (2026-07-01): the Models tab's pill flow used to stand alone with no
  explanation, while the Consensus tab paired its identical pills with a plain sentence ("Your 3
  models answer in parallel, then X merges them into one answer."). Extracted that sentence into
  a shared `consensusFlowSentence()` helper (`js/app.js`) used by both `renderModelsFlow()` and
  `renderArbitration()`, so the Models tab now shows the same plain-language explanation right
  under its pills — a user managing the model list gets the full story (who answers, who merges,
  what happens) without needing the Consensus tab's wording to differ or duplicate logic. Verified
  in a real headless-Chromium session (dark + light, 3-model + empty states): identical wording on
  both tabs, correct model names/counts, empty state unchanged (no stray blank line), zero console
  errors. (At the time this was written, a deeper structural pass — unifying the two tabs outright
  — was still left for a future run; that pass is now done, see above.)
  Original problem statement, kept for context: the config used to be split confusingly across two
  tabs and neither showed the whole picture: the **Models** tab listed selected models but not who
  arbitrates; the **Consensus** tab showed the strategy + arbiter model but gave NO indication of
  which models actually answer. A user couldn't see, in one place, the core story: "these N models
  answer in parallel → this arbiter (+ strategy) synthesizes → one consensus answer." This is the
  signature differentiator, so it had to be effortless to understand. Direction that guided the
  work above (use judgement):
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
- [x] **Make the consensus "race bar" self-explanatory (FIXED 2026-07-01, operator-reported
  2026-06-30).** The row of colored dots under "Blended from N models" (`js/app.js`
  `consensusSourcesEl`, `.cs-race` / `.cs-race-dot`) plots each model by response time but was
  unlabeled and unusable on mobile. Fixed: (1) added a visible caption/legend — "Response speed"
  with a faint "fastest → slowest" axis hint above the track; (2) each dot is now a real button
  with a CSS-driven tooltip that shows on hover (desktop) AND tap (a click toggles a `.cs-tip-open`
  class; tapping elsewhere or another dot closes it) — content includes model, time, and finish
  rank, e.g. "Claude · Opus 4.8: 3.3s (1st · fastest)"; (3) the track itself stays
  `aria-hidden="true"` (dots use `tabindex="-1"` so they're never a stray focus stop) but a
  sibling `.sr-only` paragraph now gives screen readers the full ranked summary, e.g. "Response
  times: Claude 3.3s (fastest), GPT 8.7s, Gemini 14s (slowest)". Verified in a real headless-
  Chromium session (hover, tap-open, tap-elsewhere-to-close, sr-only text, aria attributes) —
  zero console errors.

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
  visiting a non-installed site.
- [x] **iOS "Add to Home Screen" hint (shipped 2026-07-02).** The sidebar now shows a quiet,
  dismissible banner ("Add Polecat to your Home Screen so iOS doesn't clear your keys & chats")
  reusing the same visual pattern as the backup nudge. Shown only when: the device is iOS
  (`isIosDevice()` — iPhone/iPod/iPad UA, or iPadOS's Mac-like UA detected via
  `maxTouchPoints > 1`), the app isn't already installed (`isStandaloneApp()` checks
  `navigator.standalone` and `matchMedia('(display-mode: standalone)')`), there's real data at
  risk (`hasBackupWorthyData()`, reused from the backup nudge), and it hasn't been dismissed
  before (`polecat_ios_install_dismissed`, permanent — installing is a one-time action, unlike
  the recurring backup reminder). "How?" points the user at Share -> Add to Home Screen via a
  toast and dismisses the banner; "Not now" dismisses without instructions. To avoid stacking
  two sidebar nudges, the backup nudge now skips its own turn whenever the iOS hint is visible
  (`js/app.js` `maybeShowIosInstallHint`, `maybeShowBackupNudge`, `#sbIosInstallHint` in
  `index.html`). No new tracking, no server calls.
- [x] **One-tap backup nudge (shipped 2026-07-01).** Sidebar now shows a quiet "Backed up Nd
  ago" / "Never backed up" note under Export/Import (`js/app.js` `renderBackupStatus`), plus
  a rare, dismissible reminder card ("Back up your chats & keys before you lose them?" with
  "Not now" / "Export…") that only appears when there's real data at risk (`hasBackupWorthyData`
  = a saved conversation or a configured provider key), the user has been on the app 14+ days
  with no recent backup, and it hasn't been shown in the last 3 weeks (`maybeShowBackupNudge`,
  `BACKUP_STALE_MS`/`BACKUP_NUDGE_QUIET_MS`). Exporting immediately stamps `polecat_last_backup`
  and hides the nudge. Brand-new users never see it. Verified end-to-end in headless Chromium:
  fresh user -> hidden; seeded 20-day-old + unbacked-up user -> nudge shows -> Export -> hides
  + status updates to "Backed up just now" -> stays hidden on reopen. Zero console errors.
- [x] **BUG (FIXED 2026-07-04, 05:03 CT): Escape did not close the Export dialog, the What's
  New panel, or the first-run Welcome tour, unlike every other overlay in the app.** With the
  roadmap and backlog fully checked off, ran a real headless-Chromium session (puppeteer-core
  against `/usr/bin/chromium`) opening each overlay through actual UI interactions (sidebar ->
  Export / What's New buttons, and a fresh profile load for the Welcome tour) and pressing
  Escape. Settings, Shortcuts, Share, Compare, and the lightbox all already close on Escape (a
  prior pass explicitly called this out as the app-wide pattern when fixing Settings), but
  `openExport()` and `openWhatsNew()` (`js/app.js`) only ever wired a backdrop click and a
  Cancel/Close button, and the Welcome tour's overlay had no keydown handling anywhere — all
  three could only be dismissed by clicking. Fixed by adding the same scoped `keydown` listener
  pattern already used by `openCompareModal()` to both `openExport()` and `openWhatsNew()`
  (added and removed alongside the overlay), and a global Escape handler in `init()` for the
  Welcome tour that calls `dismissWelcome()` when `#welcomeOverlay` is open — matching the
  existing handlers for the other modals right next to it. Also added `welcomeOverlay` to the
  existing "don't abort an in-flight generation if any overlay is open" Escape guard, so a stray
  Escape while the tour is open can't simultaneously kill a running consensus (defensive, matches
  the existing list for every other overlay). Verified in headless Chromium: all three overlays
  now close on Escape with zero console errors; re-verified Settings and Shortcuts still close on
  Escape unchanged (no regression). `node scripts/validate.mjs` passes. `js/app.js` only.
