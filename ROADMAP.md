# Polecat roadmap

The hourly self-improve loop reads this file. When an epic has unchecked steps,
the loop advances the **next unchecked step of the highest-priority epic** as a
real, shippable, non-breaking increment — then ticks the box and adds a
`changelog.json` entry. Small standalone polish is the fallback when no epic step
can be safely advanced.

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
- [ ] **P2 — Local agreement signal (no extra cost).** In a small helper, compute
      pairwise similarity among the raw model answers (token/shingle Jaccard) and
      a rough per-model overlap with the final consensus text. Use as a fallback
      when the arbiter JSON is missing, and to cross-check its percentages.
- [ ] **P3 — Provenance panel UI.** Below the consensus answer, add a collapsible
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

## Backlog (smaller, pick up anytime)
- Gemini-style empty state: warm centered greeting + logo; consider a centered
  composer when empty that docks to the bottom after the first message.
- Keyboard shortcuts cheatsheet; per-model "regenerate"; copy-as-markdown.
- Shareable read-only consensus links (client-side encoded, no server).
