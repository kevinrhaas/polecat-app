# UI kit — Analytics (the app)

A recreation of **analytics.polecat.live/app/**, built from
`kevinrhaas/analytics.polecat.live` `app/index.html` (structure, section copy,
rail groups, topbar cluster, status bar) on the Polecat Shell token vocabulary
(`polecat-platform/lib/tokens.css` + `lib/shell.css`).

## Files
- `index.html` — the app frame: rail + topbar + swappable section area, the
  waffle switcher, the ⋯More menu, the What's-new right panel, a New-dashboard
  modal, and a live toast stack.
- `AppSections.jsx` — `RepoHero` (the one-sentence section blurb every repository
  view opens with), `ObjectTile` / `ObjectRow`, and the Home / Dashboards /
  Datasets / Connections sections with real section copy.
- `Studio.jsx` — the three-pane builder: query library, dashbar + live preview
  (KPIs and two Views, click to select), inspector, and the status bar. Toggle
  the empty-canvas state from the preview bar.
- `kit.css` — hover polish.

## Interactions
Rail collapse · section switching · tile/list toggle on Dashboards ·
Studio panel selection · empty-canvas toggle · waffle · ⋯More · right panel ·
modal → creates a dashboard and opens Studio with an undoable toast ·
palette/theme switches in Settings.

## Faithfulness notes
- `app/studio.css` is 198 KB and was **not** read in full. Panel internals
  (chart rendering, inspector field sets) are representative, not exact.
- Charts are simple CSS/SVG stand-ins; the real app renders 40+ chart types.
- Data is invented but domain-plausible (the real repo's examples are
  agricultural: CRD, HUC8, acreage-weighted means).
