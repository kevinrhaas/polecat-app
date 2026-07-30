import React from 'react';
import { Icon } from './Icon.jsx';

/* Per-app accent — one flat colour per app (lib/catalog.js `accent`).
   The second catalog stop (`accent2`) is retained here for reference only:
   the mark system is single-colour now, so it is never rendered. */
export const FLEET_ACCENTS = {
  chat: ['#8b5cf6', '#6366f1'], jobtracker: ['#1a8fd6', '#12a24f'],
  analytics: ['#d4773b', '#f55036'], autoselector: ['#3e7bfa', '#f0762f'],
  relay: ['#21c7a8', '#12b3a0'], games: ['#ff2e97', '#b14dff'],
  manager: ['#22d3ee', '#38bdf8'], modelserver: ['#d4773b', '#e8994a'],
};

/* GlyphTile — the shared mark chassis, matched to the Polecat logo: a ROUND,
   single-colour badge. The logo is a monoline creature inside a heavy ring, so
   every app mark is the same shape and construction — a ring, a stroke glyph,
   one colour. No gradients anywhere in the mark system.

   variant="ring"  (default) — the logo's own construction: hairline-to-heavy
                    accent ring, 10% accent wash, accent glyph. Use at 30px+.
   variant="solid" — accent-filled disc, white glyph. Use when the mark must
                    hold at small sizes or sit on a busy surface. */
export function GlyphTile({ app, glyph, accent, size = 30, variant = 'ring', style, ...rest }) {
  const c = accent || (FLEET_ACCENTS[app] || [])[0] || 'var(--pc-orange)';
  const ring = Math.max(1.5, Math.round(size * 0.075));
  const solid = variant === 'solid';
  return (
    <span style={{
      width: size, height: size, flex: 'none', borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: solid ? '#fff' : c,
      background: solid ? c : `color-mix(in srgb, ${c} 10%, transparent)`,
      border: solid ? 'none' : `${ring}px solid ${c}`,
      ...style,
    }} {...rest}><Icon name={glyph} size={Math.round(size * (solid ? 0.67 : 0.6))} /></span>
  );
}
