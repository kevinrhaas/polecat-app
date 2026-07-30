---
name: polecat-design
description: Use this skill to generate well-branded interfaces and assets for Polecat (polecat.live) — the independent data, analytics & AI practice and its open-source app suite — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- `readme.md` — the design guide: product landscape, content fundamentals, visual foundations, iconography, and an index of everything else.
- `styles.css` — link this one file to get every token. Site semantics live on `:root`; **in-app surfaces must set `data-palette="polecat|aurora|neon"`** on `<html>`.
- `assets/` — the new logo mark (`logo-mark.png` + transparent `-alpha`/`-white` knockouts), the legacy mascot `polecat.svg`, the OG image, and the fleet icon set (`icons.js` ES module, `icons-global.js` for plain pages).
- `components/` — React primitives, grouped: `core`, `brand`, `navigation`, `feedback`, `marketing`. Read each `*.prompt.md` for when-to-use and a usage example.
- `ui_kits/` — four full recreations to copy from: `polecat_live`, `analytics_app`, `app_front_door`, `shell_kitchen_sink`.
- `guidelines/` — small specimen cards for colors, type, spacing, brand and icons.

## Three rules that matter most

1. **Two surfaces, not one.** Marketing pages are dark, warm and atmospheric (aurora + grain + house gradient). App UI is cooler, denser and quiet. Don't mix their vocabularies.
2. **Single-color stroke icons only** (24×24, stroke-width 1.7, `currentColor`), from this set. Never emoji, never a filled or multi-color glyph.
3. **Voice: direct, honest, a little cheeky; never corporate.** Sentence case. Say what a thing does, then prove it.
