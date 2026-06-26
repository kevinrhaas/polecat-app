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
- [ ] **P4 — Inline attribution.** Optionally color/annotate sentences or sections
      of the consensus answer by originating model and/or agreement level, with a
      hover/tap tooltip ("Claude & Gemini agreed", "only GPT-5 claimed this").
      A toggle turns highlighting on/off. Must stay readable when off.
- [ ] **P5 — Polish.** Performance, graceful degradation (1 model, missing data,
      arbiter failure), reduced-motion, light/dark, and a short "What's new" +
      a one-line note on the public website explaining the agreement map.

**Done when:** a typical multi-model consensus shows an accurate, honest, and
beautiful breakdown of contribution + agreement/disagreement, on desktop and
mobile, with zero impact on time-to-first-answer.

---

## EPIC 2 — Settings & icon-system refresh  ⭐ (next after EPIC 1)

Make the chrome (settings, sidebar, overlays) sleek, modern, simpler and less
confusing, with a consistent icon language and zero emoji.

- [x] **Fix the settings blur-on-open bug** — the modal rendered blurred until a
      click; moved `backdrop-filter` to a `::before` layer so the panel is never
      inside a blurred ancestor. (Apply the same pattern to the welcome, export,
      and lightbox overlays — they share the bug.)
- [ ] **Consistent SVG icon set.** Replace UI emoji with simple modern stroke
      icons (sidebar ⚙/◐/⤓/⤒/🗑, the ✨ CTA, 👁/⊘ vision marks, key-help 🔑/💸,
      welcome-slide glyphs, etc.). One coherent style; accessible labels/titles.
- [ ] **Settings IA cleanup.** Audit the Models/Keys/Arbitration/Support tabs:
      simplify, group sensibly, clearer labels & helper text, less clutter,
      better mobile. A beginner should grok it instantly. Reorder/rename freely.
- [ ] **Apply blur-layer fix to remaining overlays** (welcome, export, lightbox).

---

## WEBSITE (kevinrhaas/polecat) — the loop's Part 2 should advance these too

- [ ] **Fun, real example carousel.** Build it from the operator-curated REAL
      content in `website/examples.json` (6 examples: cooking, history, music,
      coding, travel, sports — each with the prompt, 2–3 differing model takes,
      and the consensus). Render as **uniform, brand-matched cards** (same frame/
      aspect/dark theme) — NOT raw screenshots; auto-rotate, pause on hover,
      swipeable on mobile, respect reduced-motion, link into the app / free demo.
      Show the "they disagreed → consensus reconciled" (and the one "they agreed →
      trust it") story. **Remove the old standalone "baking soda" example; keep the
      cooking one.** Quality & consistency over quantity.
- [ ] Keep the website's brand, "last updated" stamp, and changelog in sync with
      the app; emphasise the cross-model consensus differentiator.

---

## Backlog (smaller, pick up anytime)
- **README.md** for the repo (currently missing): what Polecat is, the
  cross-model + consensus/arbitration differentiator, BYOK + zero-config free
  demo, the Cloudflare proxy, privacy (100% in-browser), the hourly self-improve
  loop, and links to app.polecat.live. Make it polished — it's the GitHub front door.
- Gemini-style empty state: warm centered greeting + logo; consider a centered
  composer when empty that docks to the bottom after the first message.
- Keyboard shortcuts cheatsheet; per-model "regenerate"; copy-as-markdown.
- Shareable read-only consensus links (client-side encoded, no server).
