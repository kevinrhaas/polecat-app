How an app identifies itself anywhere in the fleet — launcher tile, marketing header, in-app rail.

```jsx
<GlyphTile app="analytics" glyph="chart" size={44} />
<GlyphTile app="manager" glyph="gauge" size={30} />
<GlyphTile app="games" glyph="gamepad" size={24} variant="solid" />
```

- **Round, single-colour, no gradient** — the mark echoes the Polecat logo: a stroke creature inside a heavy ring. `variant="ring"` is the default; `variant="solid"` (accent disc, white glyph) is for small sizes or busy surfaces.
- The ring weight is 7.5% of the tile size, so the mark reads the same at 24px and 44px.
- Same glyph, same name, same accent across all three surfaces. If they disagree, the catalog wins.
- Never put the polecat mark itself on an app page — apps identify with their glyph tile.
- On hover in the launcher grid the tile pops: `scale(1.12) rotate(-5deg)`, `cubic-bezier(.34,1.56,.64,1)`.
