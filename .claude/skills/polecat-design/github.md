repo: kevinrhaas/polecat-platform
branch: main

## Last sync
date: 2026-07-28T19:10:00Z

### Updated in this project
- Built the token layer from `lib/tokens.css` (fleet palettes) and `site/css/site.css` (marketing semantics).
- Ported the icon set verbatim from `lib/icons.js`; copied `site/assets/polecat.svg` and `og-image.png`.
- Authored 33 React primitives from `lib/shell.css` + `lib/site-chrome.css`.
- Recreated four surfaces: polecat.live, the Analytics app, an app front door, and the shell kitchen sink.

## Screen map
| Project screen | Built from |
|---|---|
| `ui_kits/polecat_live/` | polecat-platform: `site/index.html`, `site/css/site.css`, `site/js/main.js`, `lib/catalog.js` |
| `ui_kits/analytics_app/` | analytics.polecat.live: `app/index.html` · polecat-platform: `lib/shell.css`, `lib/tokens.css` |
| `ui_kits/app_front_door/` | analytics.polecat.live: `css/landing.css` · polecat-platform: `lib/site-chrome.css` |
| `ui_kits/shell_kitchen_sink/` | polecat-platform: `lib/shell.css`, `lib/tokens.css`, `lib/demo/` |
| `tokens/*.css` | polecat-platform: `lib/tokens.css`, `site/css/site.css`, `lib/site-chrome.css` |
| `components/**` | polecat-platform: `lib/shell.css`, `lib/site-chrome.css`, `lib/icons.js`, `lib/catalog.js` |
| `readme.md` (brand guide) | polecat-platform: `docs/BRAND.md`, `docs/PLATFORM.md`, `README.md`, `site/index.html` |
| `assets/icons.js` | polecat-platform: `lib/icons.js` |

## Related repos read
- kevinrhaas/analytics.polecat.live — `app/index.html`, `css/landing.css` (app/studio.css not read in full)
- kevinrhaas/jobtracker.polecat.live — tree only (the DNA the shell was ported from)
- kevinrhaas/manager.polecat.live, autoselector.polecat.live, relay.polecat.live — listed, not read in depth
