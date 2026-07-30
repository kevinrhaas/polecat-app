The only icon source for Polecat work — do not substitute Lucide, Heroicons or emoji.

```jsx
<Icon name="chart" size={22} />
<Icon name="search" size={16} style={{ color: 'var(--text-3)' }} />
```

- Colour comes from `currentColor`, so set `color` on the parent.
- Fleet app glyphs: `chat briefcase chart car network gamepad gauge terminal`.
- `Object.keys(ICON_PATHS)` (from `components/brand/iconPaths.js`) enumerates the ~85 glyphs for pickers; `assets/icons-global.js` exposes `PolecatIcons.iconNames()` for plain HTML.
