# Polecat roadmap

The hourly self-improve loop reads this file. When an epic has unchecked steps,
the loop advances the **next unchecked step of the highest-priority epic** as a
real, shippable, non-breaking increment — then ticks the box and adds a
`changelog.json` entry. Small standalone polish is the fallback when no epic step
can be safely advanced.

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
