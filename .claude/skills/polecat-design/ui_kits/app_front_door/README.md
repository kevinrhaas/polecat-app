# UI kit — app front door (Analytics landing)

The fleet's **marketing landing page** pattern: the shared `psx-` header and
footer from `polecat-platform/lib/site-chrome.css`, wrapped around the app's own
hero and sections. Built from `analytics.polecat.live/css/landing.css`.

App front doors deliberately do **not** load the in-app shell — its `.btn` would
fight the marketing buttons. They carry their own light, cream-and-paper palette
with a dark plum hero:

```
--ax-bg #F7EEDF · --ax-pane #FFFBF4 · --ax-ink #2E2A33 · --ax-brand #c1602c
--ax-hero linear-gradient(150deg,#231e28,#3A2F3A 55%,#4a3a48)
```

## Files
- `index.html` — the whole page (header, hero + screenshot carousel frame,
  feature cards, source chips, final CTA, footer).

## Adopting it for another app
Change three things: the app id/glyph/name on `SiteHeader` and `SiteFooter`, the
accent pair (from `lib/catalog.js`), and the hero copy. Everything else is
shared chrome.

## Missing asset
The hero carousel frame holds a labelled **placeholder** — no product
screenshots were available. The live pattern cross-fades real 2160×1350 app
screens, `object-position: top left`, over 0.6s. Drop images in and delete the
placeholder block.
