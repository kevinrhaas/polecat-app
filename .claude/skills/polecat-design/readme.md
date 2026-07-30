# Polecat Design System

The design system for **Polecat** (polecat.live) — an independent data, analytics
and AI practice run by Kevin R. Haas, and the open-source software suite it
ships. Polecat builds data, analytics, and application software for targeted
problems — designed by thirty years of enterprise data experience, built by a
fleet of AI agents that ship and test around the clock. *All the output of a
team. None of the meetings.*

Everything here is lifted from the real, shipped code (see § Sources). Where a
value differs from what a framework would do, the shipped value wins.

---

## The product landscape

Polecat is a **hub + spokes** fleet. One shared library, many small apps, each
on its own domain, each deployed independently, all static-first (plain HTML +
ES modules + CSS; no bundler, no framework, no build step).

| Surface | What it is | Design vocabulary |
|---|---|---|
| **polecat.live** | The suite front door + app launcher + the consulting pitch | Marketing: dark warm-amber, aurora blobs, film grain, gradient wordmark |
| **App front doors** | One marketing landing page per app (`analytics.polecat.live`, etc.) | Shared `psx-` header/footer chrome + the app's own hero, tinted by its accent |
| **Polecat Shell** | The vendored in-app UI library: rail + topbar + right panel, toasts, modals, icons, settings, tours | App: `ps-` layout classes on the `tokens.css` vocabulary |
| **The apps** | Analytics, JobTracker, Manager, AutoSelector, Relay, Chat, Games, Model Server | Shell tokens + per-app accent + per-app sections |

The eight apps in the fleet (canonical list, `lib/catalog.js`):

| App | Glyph | Accent → Accent 2 | Tagline |
|---|---|---|---|
| Chat | `chat` | `#8b5cf6` → `#6366f1` | Ask once. Hear from everyone — multi-model consensus. |
| JobTracker | `briefcase` | `#1a8fd6` → `#12a24f` | Creative-work tracking with saved views, boards, and joy. |
| Analytics | `chart` | `#d4773b` → `#f55036` | Connect your data, build dashboards, share anywhere. |
| AutoSelector | `car` | `#3e7bfa` → `#f0762f` | The joyful way to find your car. |
| Relay | `network` | `#21c7a8` → `#12b3a0` | Serverless peer-to-peer tables and chat. |
| Games | `gamepad` | `#ff2e97` → `#b14dff` | An ever-growing neon arcade of story-driven retro games. |
| Manager | `gauge` | `#22d3ee` → `#38bdf8` | Mission control for the fleet. |
| Model Server | `terminal` | `#d4773b` → `#e8994a` | Your own OpenAI- & Anthropic-compatible model server. |

**The mark system: one chassis, a glyph per app.** Every app is a single-color
stroke glyph inside the same rounded, gradient-filled tile. The chassis is the
constant that makes the family cohere; the glyph and the accent make each app
itself. An app's icon reads the same on the launcher, on its landing page, and
inside the app — the catalog is the tiebreaker when they disagree.

---

## Sources

Read from GitHub on 2026‑07‑28. The reader may not have access; recorded so
they can go deeper if they do. **Read these repos directly for anything this
guide abbreviates** — they are the ground truth, and the shell library is small
enough to read end to end.

- **https://github.com/kevinrhaas/polecat-platform** — the hub. `docs/BRAND.md`
  (brand standards), `lib/tokens.css` (the token vocabulary), `lib/shell.css`
  (all in-app component CSS), `lib/site-chrome.css` + `.js` (the shared
  marketing header/footer), `lib/icons.js` (the icon set), `lib/catalog.js`
  (the fleet registry), `site/` (polecat.live itself: `index.html`,
  `css/site.css`, `js/main.js`).
- **https://github.com/kevinrhaas/analytics.polecat.live** — the deepest app.
  `app/index.html` (rail + topbar + sections + Studio three-pane),
  `css/landing.css` (the app-front-door pattern), `app/studio.css` (198 KB of
  app-specific CSS — not fully read here).
- **https://github.com/kevinrhaas/jobtracker.polecat.live** — the DNA the shell
  was ported from (`css/styles.css`, `js/icons.js`, `js/illustrations.js`).
- **https://github.com/kevinrhaas/manager.polecat.live** — fleet mission control.
- **https://github.com/kevinrhaas/autoselector.polecat.live** — consumer-facing app.
- **https://github.com/kevinrhaas/relay.polecat.live** — P2P app.

Uploaded by the user: `uploads/IMG_6555.png` — **the new Polecat logo** (see
§ Logo & marks). It supersedes the cream/blush mascot still shipping on
polecat.live.

---

## CONTENT FUNDAMENTALS

**The voice in one line:** *Open-source software for targeted problems, built at
agent scale. Direct, honest, a little cheeky; never corporate. We say what a
thing does, then prove it.* ("Elegant, modern, joyful" is treated as a
requirement, not decoration.)

**Person.** Product and platform copy is **we** ("Polecat works from the other
direction", "the same factory is available for *your* targeted problem").
Consulting copy switches to **I** — deliberately, because it is one human
("I've spent thirty years in enterprise data"). Never "our team". The joke is
that there isn't one.

**Address the reader as "you", and mean it.** "Your data lives in your browser
unless you connect a backend — including your own." Benefits are stated as
things the reader gets, not features the product has.

**Casing.** Sentence case everywhere — headings, buttons, nav, menu items
("See what we've shipped", "Save as…", "Clear local data…"). ALL-CAPS is
reserved for micro-labels: kickers (`THE IDEA`, `PROOF, NOT PROMISES`), rail
group labels (`WORKSPACE`, `BUILD`, `MANAGE`), stat captions, the tech ticker,
and the scroll cue. Title Case appears only in proper nouns and app names.

**Sentence rhythm.** Long, confident, em-dash-heavy explanatory sentences,
then a short flat one that lands the point. Fragments are allowed and used:
"All the output of a team. None of the meetings." / "The agents don't sleep. I
occasionally do." / "Yes, really."

**Punctuation.** Em dashes (unspaced, `—`) do the heavy lifting. Middot `·`
separates footer and status-bar items. `→` and `↗` appear inside link labels
("Work with me →", "Polecat ↗"). Ellipsis `…` marks any action that opens
further input ("Save as…", "Export dashboards…", "Import…").

**Numbers as proof, never as decoration.** The stats band is four numbers only,
and one is a joke that is also true: `7 live apps · 900+ releases shipped ·
100% open source · 0 meetings held`. Versions and dates on the launcher come
from each app's real changelog — never hand-typed.

**Claims are hedged honestly.** Known problems are named in public ("Known
drift to reconcile"), limits are stated plainly ("the in-app gate is UX-level
gating, not a security boundary; docs say so plainly"), and failures are
documented with the cost ("a `needs: test` gate once froze analytics for ~21
hours").

**Empty states and hints teach.** They say what to do next, in lowercase
instruction voice: "Drop a query here to add a View" · "click to edit · drag
the header to reorder · drag the right edge to resize" · "Drag a dataset or
sample query from the Data panel onto the canvas".

**Microcopy patterns.**
- Section blurbs are one sentence explaining what the section is *for*:
  "Named, parameterizable queries defined on top of your connections — the
  reusable building blocks dashboards are made of."
- Primary buttons are verb-first and confident: `Send it`, `Launch app`,
  `Let's talk`, `+ New dataset`, `Open console`.
- Secondary/escape actions are plain: `Close`, `Cancel`, `Sign out`.
- Footer line 1 is always exactly: `AppName · part of the polecat.live suite`
  ("suite", never "family").
- Tooltips explain *consequence*, not the label: "Opens the dashboard in a new
  tab and starts your browser's print dialog".

**Emoji: no.** Not in UI, not in copy, not in headings. The fleet's design bar
is explicit about single-color stroke iconography instead. A few **unicode
glyphs** are used as functional symbols (`▾ ↶ ↷ ▶ ✦ ⓘ ✓ · → ↗ ⌘K ？`), and a
single hidden `✦`-style easter-egg mark sits at 12% opacity in the corner of
polecat.live. That is the entire allowance for whimsy in type.

**Don't write:** "seamless", "leverage", "empower", "revolutionary",
"best-in-class", "enterprise-grade" as a boast (it appears exactly once, as a
setup for "finally cost-effective"), or anything an enterprise sales deck would
say. Don't promise a roadmap you can't ship this week.

---

## VISUAL FOUNDATIONS

### The two surfaces
Polecat has **two** related visual systems, and they are deliberately not
identical:

1. **Site** (polecat.live + app front doors) — dark, warm, atmospheric,
   gradient-forward, animated. Its job is to feel *made by someone with taste*.
   Tokens: `--bg #0b0a10`, `--surface #16131f`, `--brand-b #e08a45`.
2. **App** (Polecat Shell) — cooler, denser, quieter, high-contrast, minimal
   ornament. Its job is to disappear. Tokens: `--bg #0a0a0f`,
   `--surface #111118`, `--brand #d4773b`, plus `aurora` and `neon` palettes.

Both ship a **real light theme** (not an afterthought): the site's light mode is
cream and paper (`#FBF7F1`/`#FFFFFF`, warm `#E5D9C5` borders); the app's light
mode is cool white (`#f4f4fb`/`#ffffff`, `#d0d0e4` borders). Theme is stamped on
`<html>` pre-paint by an inline script, so there is never a flash.

### Color
- **House palette:** brown `#9C6B3F` → orange `#e08a45` → blush `#F4A6A6`, with
  cream `#F5E9D6` as the warm light and plum `#2E2A33` as the deep warm ink.
  Purple `#b070f0` exists **only** as an ambient glow — never text, never fill.
- **The house gradient** is one fixed recipe:
  `linear-gradient(110deg,#9C6B3F,#e08a45 45%,#F4A6A6)`. It appears on the
  wordmark ("cat" in Pole**cat**), primary CTAs, kicker ticks, stat numbers,
  the scroll-progress thread, and nothing else — **never on an app mark.**
- **Max two background colors per surface**: page `--bg` and band `--bg-2`.
  Sections alternate plain / `.band` (banded sections get 1px borders top and
  bottom) — that alternation *is* the page rhythm.
- **Accents are a spark, not a repaint.** An app accent tints its tile, its
  primary CTA, and hover borders. Chrome text and surfaces always follow the
  viewer's theme, never the app's brand color.
- Accent mixing is done with `color-mix(in srgb, var(--c) 14%, transparent)` for
  tints, `32–45%` for borders — never hand-picked tint hexes.

### Type
- **Hanken Grotesk** is the brand face, self-hosted from `fonts/` in all nine
  weights, roman and italic (`--font-brand`). It is this design system's own
  upgrade: the shipped fleet loads **zero** font files (site pages run on the
  raw system stack; the app stack merely *names* Inter), so the same system
  fallbacks sit behind it and first paint never blocks.
  Weights used: 400/500/600/700/**800**. 800 is the brand weight — every
  heading, wordmark, kicker, stat and app name is 800.
- **Tight display tracking:** h1 `clamp(38px,6.4vw,66px)` / `-1.5px` /
  `line-height 1.05`; h2 `clamp(24px,4vw,36px)` / `-0.8px` / `1.15`.
- **Generous prose:** site body `line-height 1.6`, long-form paragraphs `1.75`,
  lead text in `--text-2` (never full-contrast).
- **Loose micro-labels:** kicker 12px/800/uppercase/`+1.5px`; rail groups
  10px/uppercase/`.09em`; scroll cue 11px/`+2.5px`.
- **App UI is 14px/1.5** with a fixed control scale: 13.5px buttons, inputs and
  rail items; 12.5px small; 12px pills; 11.5px chips; 10.5px badges.
- Mono (`--mono`) is for versions, object IDs, keyboard hints and `<kbd>` only.

### Backgrounds & texture
Layered, never flat, never a photograph:
1. **Aurora** — three 60vmax blurred color circles (`#b070f0`, `--brand-b`,
   `--blush`), `blur(90px)`, `opacity .18–.28`, `mix-blend-mode: screen`,
   drifting on a 30s loop behind everything (`z-index:-2`).
2. **Film grain** — a fixed SVG `feTurbulence` tile at `opacity .05`, jittering
   in 4 steps over 1.2s (`z-index:60`, above content).
3. **Radial glows** — a hero glow behind the mascot, a breathing halo ring
   behind the final CTA, and a per-card accent wash
   (`radial-gradient(120% 90% at 20% 0%, accent 14%, transparent 60%)`) that
   fades in on hover.
4. **Scroll progress** — a 2.5px gradient thread pinned to the very top.

No stock photography anywhere. Real product screenshots are used as hero
imagery on app front doors, framed in a `16px`-radius, `2160/1350`-ratio card
with a 1px light border and a deep shadow, cross-fading over 0.6s. Illustration
is limited to the mascot mark and to JobTracker's own inline illustration set.

### Motion
Quick on interaction, generous on entrance, and every single animation has a
`prefers-reduced-motion` off-switch (plus a stored user override that sets
`html[data-reduce-motion="1"]`, which kills all animation and transition).
- **Interaction:** `.08s` press, `.12s` button hover, `.16s` card hover,
  `.22s` rail width with `cubic-bezier(.4,0,.2,1)`.
- **Entrance:** hero children rise 22px with a blur-out over `.7s`
  `cubic-bezier(.22,.8,.3,1)`, staggered `.08s` apart. Scroll reveals rise 24px
  from `blur(4px)` over `.55–.6s`, cascading `.08s` per grid child.
- **Character:** toasts overshoot in (`cubic-bezier(.2,.9,.3,1.2)`); glyph tiles
  pop on hover (`scale(1.12) rotate(-5deg)`, `cubic-bezier(.34,1.56,.64,1)`);
  the mascot floats ±10px on a 4.5s loop and wiggles when poked; the primary CTA
  pulses a 9px halo every 3.2s; a light shine sweeps across primary buttons,
  stat cards and app cards on hover.
- **Ambient:** aurora drift 30s, tech ticker 44s linear (paused on hover),
  gradient hue-drift 9s.

### Interaction states
- **Hover, site:** lift (`translateY(-2px)` on buttons, `-3px` on cards),
  border warms to `color-mix(accent 40–45%, border)`, accent wash fades in,
  shine sweeps. Text links go `--text-2` → `--text`; nav links grow a 2px
  gradient underline from 0 → 100% width over `.22s`.
- **Hover, app:** background steps up one surface (`--surface-2` →
  `--surface-3`) and lifts 1px. Never a color change on chrome.
- **Press:** the lift is removed (`translateY(0)`) — pressing settles the
  element back down. No scale-down, no color flash.
- **Focus:** `box-shadow: 0 0 0 3px color-mix(brand 40%, transparent)` in-app;
  `outline: 2px solid var(--brand-b); outline-offset: 2px` on the site.
  Never removed, never replaced with a border shift.
- **Active/selected, rail:** `color-mix(rail-accent 16%, transparent)`
  background plus a 3px gradient bar bleeding off the left edge.
- **Disabled:** `opacity .4` + `cursor:not-allowed` and the lift removed.
- **Selection:** `::selection` is a 40–55% brand mix.

### Borders, radii, shadows
- **1px borders, everywhere**, in `--border` (`#2c2738` site / `#2a2a3c` app).
  Cards are border-first; shadow is the accent, not the structure. The one
  gradient border in the system is the "Why this works" advantage card
  (padding-box/border-box double background).
- **Radii:** site cards `16px`, small controls `10px`; app cards `14px`, small
  `9px`, large/modal `20px`; buttons and chips are full pills (`100px`/`999px`);
  glyph tiles are ~28–30% of tile size (`9px`@30, `11px`@38, `12px`@44).
- **Shadows** are soft, large and dark — never a hairline drop shadow:
  card hover `0 14px 38px rgba(0,0,0,.35)`, primary CTA
  `0 6px 22px rgba(224,138,69,.28)` (brand-tinted, not black), modal
  `0 24px 70px rgba(0,0,0,.55)`, app `--shadow 0 24px 64px rgba(0,0,0,.5)`.
  Glyph tiles carry a colored `0 4px 14px color-mix(accent 30%)`.
- **Inner shadows: none.** Depth comes from surface steps and 1px lines.

### Transparency & blur
Blur is used in exactly three places and nowhere else: sticky nav / topbar
(`backdrop-filter: blur(12px)` over a ~72–82% surface), modal scrims
(`blur(4–5px)` over `rgba(6,4,20,.6)`), and the carousel arrows on app front
doors (`blur(8px)`). Everything else is opaque. Gradient masks (rather than
capsules or fades) handle overflow: the ticker is edge-masked with
`mask-image: linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)`.

### Layout rules
- One content column, `max-width: 1080px`, `22px` gutters (`14px` on phones);
  prose narrows to `880px`, lead text to `720px`, the hero to `860px`.
- Vertical rhythm: `80px` section padding, `56px` below 520px.
- Grids: apps 3-up → 2-up @900px → 1-up @560px; expertise 3-up; method 2-up;
  stats 4-up → 2-up @640px. Gaps are `14–16px`.
- Fixed/sticky elements: the nav (`top:0`), the scroll-progress thread, the
  grain layer, the aurora, and the corner easter egg. In-app: the rail (fixed
  overlay drawer below 860px), the topbar, the right panel, `#toasts`
  bottom-right, and a mobile tab bar.
- **Mobile is a release gate, not a port** (390×780 smoke test). Below 860px the
  rail becomes an overlay drawer; below 640px nav links collapse into a
  drawer and section links hide from the shared header; below 520px modals
  become full-screen sheets. All hit targets ≥44px (WCAG 2.5.5) — enforced with
  `min-height:44px` on buttons at those breakpoints.
- Safe-area insets are honored on every fixed edge (`env(safe-area-inset-*)`).

### Imagery vibe
Warm, low-key, slightly nocturnal. Dark plum-black grounds with amber and blush
light; purple only as atmosphere. Product screenshots are shown as-is (real UI,
real data), cropped `object-position: top left`. Grain over everything keeps it
from looking sterile. Nothing cool-blue, nothing corporate-photographic,
nothing AI-gradient-mesh.

---

## ICONOGRAPHY

**One set, shipped in the repo: `assets/icons.js`** (verbatim from
`polecat-platform/lib/icons.js`). This is the fleet's own hand-authored icon
family — do not substitute Lucide, Heroicons or anything else.

- **Format:** inline SVG strings, `24×24` viewBox, `fill="none"`,
  `stroke="currentColor"`, `stroke-width="1.7"`, round caps and joins.
- **Rule:** single-color, stroke-based, always `currentColor`. *Never*
  multi-color, never filled, never a two-tone duotone set. This is stated as a
  fleet design bar, not a preference.
- **API:** `icon(name, size = 20)` returns an SVG string wrapped in `class="ic"`.
  `registerIcons(map)` lets an app add its own family (bare path data or an
  inner-SVG string) without clobbering the base set; app icons win lookups so an
  app can deliberately override a glyph. `iconNames()` enumerates everything.
  A browser-global build (`assets/icons-global.js`, exposing
  `window.PolecatIcons`) is included for plain HTML pages and cards.
- **Sizes in use:** 15px (small tile), 18px (`psx-tile`), 20px (default, waffle),
  22px (rail logo), 24px (source viewBox), 26px (status glyph).
- **The base set** (~85 glyphs): navigation and UI (`home grid list board
  calendar timeline settings search plus menu chevron chevronDown chevronUp
  close more filter sort`), objects (`db layers folder tag notes archive book
  inbox users`), actions (`edit trash copy clone link upload download undo redo
  refresh history play eye eyeOff comment`), status (`check clock info warn
  shield lock key bell flag star fire bolt sparkle wand target`), data
  (`chart activity gauge sliders terminal branch compass globe trophy pin grip
  external`), media (`back fullscreen sound muted`), and the authored
  `waffle` 3×3 launcher grid + `arrowRight`.
- **Fleet app glyphs** (one per app, used by the launcher, the waffle, the
  marketing header and the in-app rail): `chat briefcase chart car network
  gamepad gauge terminal`.
- **Unicode as icon:** used sparingly and only where a glyph would be overkill —
  `▾` (menu caret), `↶ ↷` (undo/redo), `▶`, `✦`, `ⓘ`, `？`, `·`, `→`, `↗`,
  `⌘K`, `＋`. **No emoji, ever.**
- **PNG/raster icons** exist only as PWA app icons and favicons per app
  (`favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) — never
  inside the UI.

### Logo & marks
- **`assets/logo-mark.png` — the new Polecat mark** (user-supplied, 1254×1254):
  a monoline polecat head-and-tail inside a heavy ring, pure black on white.
  Knocked-out working copies are provided: `assets/logo-mark-alpha.png`
  (transparent, black) and `assets/logo-mark-white.png` (transparent, white) —
  use the white one on dark and on brand-orange surfaces.
  **It is raster only.** ⚠️ Ask the brand owner for an SVG before any print,
  large-format or favicon use.
- **`assets/polecat.svg` — the legacy mascot** still live on polecat.live: a
  cream/brown/blush masked-cat face. Kept for fidelity when recreating the
  current site. Per `docs/BRAND.md` the mascot is the master mark on
  polecat.live only and is explicitly **not** to be copied onto app pages — apps
  identify with their own glyph tile.
- **`assets/og-image.png`** — the 1200×630 social card for polecat.live.
- **`assets/shots/`** — real product screenshots pulled from the app repos'
  landing-page carousels: Analytics (home, studio, dashboard, explore, datasets,
  map), Manager (dashboard, fleetops, releases), AutoSelector (compare,
  matchmaker, mobile). Use these as hero imagery rather than mockups.
- **Wordmark:** "Pole" in `--text` + "cat" in the house gradient, 800 weight,
  `-0.4px` tracking. The root footer uses a larger 22px `-0.6px` variant. Never
  set the wordmark in the app accent color.

---

## Index

**Foundations** — the root token entry point is `styles.css` (imports only):

- `tokens/palette.css` — raw house palette, the house gradient, per-app accents
- `tokens/colors-site.css` — site semantics (`:root` dark + `[data-theme=light]`)
- `tokens/colors-app.css` — Polecat Shell semantics: `polecat`, `aurora`, `neon`
  palettes × dark/light. **App surfaces must set `data-palette`.**
- `tokens/fonts.css` — the Hanken Grotesk `@font-face` set (18 files)
- `tokens/typography.css` — font stacks + the site and app type scales
- `tokens/spacing.css` — space scale, layout widths, rail widths, breakpoints
- `tokens/radii-shadows.css` — radii, borders, shadows, focus rings
- `tokens/motion.css` — durations, easings, lift amounts

**Specimen cards** (the Design System tab) live in `guidelines/` —
`brand/`, `colors/`, `type/`, `space/`, `icons/`.
Longer prose: `guidelines/CONTENT.md`, `guidelines/BRAND-STANDARDS.md`.

**Assets** — `assets/logo-mark.png` (+ `-alpha`, `-white`),
`assets/polecat.svg` (legacy mascot), `assets/og-image.png`,
`assets/icons.js` (ES module), `assets/icons-global.js` (`window.PolecatIcons`).

**Components** — `components/<group>/`:

- `core/` — `Button` `IconButton` `Pill` `Chip` `Input` `Select` `Textarea`
  `Field` `Toggle` `Segmented` `Kbd`
- `brand/` — `Icon` `GlyphTile` `Wordmark` `Kicker` `GradientText`
- `navigation/` — `Rail` `RailItem` `Topbar` `Waffle` `SiteHeader` `SiteFooter`
- `feedback/` — `Toast` `Modal` `Sheet` `PopMenu` `RightPanel` `EmptyState`
- `marketing/` — `AppCard` `StatCard` `FeatureCard` `Ticker` `ScrollCue`
  `AdvantageBand` `AuroraBackdrop`

**UI kits** — `ui_kits/<product>/`:

- `polecat_live/` — the suite front door: nav, hero, ticker, the idea + stats
  band, the app launcher grid, how-we-build, consulting, about, connect, footer
- `app_front_door/` — the shared marketing chrome pattern, on Analytics
- `analytics_app/` — the Analytics app: rail, topbar, Dashboards / Datasets /
  Connections sections, and the Studio three-pane builder
- `shell_kitchen_sink/` — the Polecat Shell primitives in situ: rail states,
  topbar, waffle switcher, toasts, modal, right panel, settings controls

**`SKILL.md`** — Agent-Skills front matter so this folder works as a skill.
**`github.md`** — source-repo association for one-click upstream sync.

### Intentional additions
- `Icon` and `GlyphTile` are React wrappers over `lib/icons.js` and the
  `.psx-tile` / `.app-glyph` / `.ps-rail-logo` chassis — the source implements
  these as string helpers and CSS classes, not components.
- `Kbd`, `EmptyState`, `AuroraBackdrop` and `ScrollCue` wrap real shipped
  markup patterns (`kbd`, `.sec-empty`, `.aurora`, `.scroll-cue`) that had no
  component boundary in a build-step-free codebase.

### Known gaps
- `app/studio.css` (198 KB) and the app JS bundles were not read in full; the
  Studio three-pane recreation is built from `app/index.html` structure plus the
  shell's token vocabulary, so inner-panel details are approximate.
- No font binaries exist in any Polecat repo (by design); the fleet's own pages
  render on the system stack. Hanken Grotesk is supplied by the brand owner and
  self-hosted here, so this system's type is *ahead* of what production ships —
  worth reconciling upstream.
- The new logo is raster only.
