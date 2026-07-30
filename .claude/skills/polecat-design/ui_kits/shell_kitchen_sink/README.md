# UI kit — Polecat Shell kitchen sink

The shell's own smoke-test target, rebuilt: every primitive in situ, inside a
real rail + topbar frame. Mirrors `polecat-platform/lib/demo/` and is built from
`lib/shell.css` + `lib/tokens.css`.

## Why it exists
It is the fastest way to see whether a change to the tokens holds up. The
**palette × theme** switches at the top left flip `[data-palette]` and
`[data-theme]` on `<html>` — every component below reads tokens only, so
`polecat`, `aurora` and `neon`, dark and light, all come for free. If something
breaks under one of the six combinations, it is the component that is wrong.

## Files
- `index.html` — the whole kit: rail (collapsible, grouped, badged), topbar with
  the ⌘K search, buttons, icon buttons, pills, chips, switches, segmented
  controls, fields, overlays (modal / sheet / right panel / toasts / pop menu),
  the fleet glyph tiles, and an empty state.
