# UI kit — polecat.live (the suite front door)

A recreation of **https://polecat.live**, built from `kevinrhaas/polecat-platform`
`site/index.html` + `site/css/site.css` + `site/js/main.js`.

## Files
- `index.html` — the page. Mounts the aurora backdrop, the scroll-progress
  thread, the nav, the hero, the tech ticker, then every section, then the root
  footer variant.
- `Chrome.jsx` — layout constants (`WRAP`, `BAND`, `H2`, `LEAD`), `SectionHead`,
  `Nav` (with a working light/dark toggle) and `Hero`.
- `PageSections.jsx` — `Idea` (+ the four stats), `Launcher` (the eight-app grid),
  `Method`, `Work` (+ `AdvantageBand`), `About`, `Connect` (a working form with a
  thank-you state), `FinalCta`, and the `useReveal` scroll-reveal observer.
- `kit.css` — the hover/reveal/entrance polish the DS components express as
  props (they render inline styles, so these rules use `!important`).

## What's interactive
Theme toggle · scroll-progress thread · scroll reveals with a .08s cascade ·
nav underline sweeps · card lifts and accent washes · the connect form submits
to a thank-you panel · the ticker pauses on hover.

## Faithfulness notes
- Version and ship dates on the launcher tiles are **plausible stand-ins**. The
  live page ingests each app's `/js/changelog.js`; nothing here is fetched.
- The hero mark is the **new** logo (`assets/logo-mark-white.png`). The live site
  still shows the legacy cream mascot (`assets/polecat.svg`).
- The hidden corner easter egg on the real page is not reproduced.
