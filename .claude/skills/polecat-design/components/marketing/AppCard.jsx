import React from 'react';
import { Icon } from '../brand/Icon.jsx';
import { GlyphTile, FLEET_ACCENTS } from '../brand/GlyphTile.jsx';

/* AppCard — one tile in the polecat.live launcher grid (site.css `.app-card`).
   Border-first card; on hover it lifts 3px, the border warms to 45% accent, an
   accent wash breathes in from the top-left, a shine sweeps across, the glyph
   pops, and the ↗ slides in. Status line reads live from the app's changelog. */
export function AppCard({ app, glyph, name, host, tagline, version, shipped, status = 'live', fun, hover, style, ...rest }) {
  const [c] = FLEET_ACCENTS[app] || ['var(--brand-b)'];
  return (
    <a href={`https://${host}`} style={{
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 10,
      background: 'var(--surface)', borderRadius: 'var(--r)', padding: 22, textDecoration: 'none',
      overflow: 'hidden', color: 'var(--text)',
      border: '1px solid ' + (hover ? `color-mix(in srgb, ${c} 45%, var(--border))` : 'var(--border)'),
      transform: hover ? 'translateY(-3px)' : 'none',
      boxShadow: hover ? 'var(--shadow-card-hover)' : 'none',
      transition: 'transform var(--d-hover), border-color var(--d-hover), box-shadow var(--d-hover)', ...style,
    }} {...rest}>
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: hover ? 1 : 0,
        background: `radial-gradient(120% 90% at 20% 0%, color-mix(in srgb, ${c} 14%, transparent), transparent 60%)`,
        transition: 'opacity var(--d-panel)',
      }} />
      <span style={{
        position: 'absolute', top: 18, right: 18, color: hover ? c : 'var(--text-3)',
        opacity: hover ? 1 : 0, transform: hover ? 'none' : 'translateX(-4px)',
        transition: 'opacity var(--d-hover), transform var(--d-hover)',
      }}><Icon name="external" size={17} /></span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <GlyphTile app={app} glyph={glyph} size={44} style={{
          transform: hover ? 'scale(1.12) rotate(-5deg)' : 'none',
          transition: 'transform 220ms var(--e-pop)',
        }} />
        <span>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>{name}</span>
          {fun && <span style={{
            marginLeft: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 'var(--r-pill)', color: c,
            background: `color-mix(in srgb, ${c} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${c} 32%, transparent)`,
          }}>{fun}</span>}
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>{host}</span>
        </span>
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-2)', flex: 1 }}>{tagline}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)', minHeight: 18 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flex: 'none',
          background: status === 'live' ? 'var(--ok)' : 'var(--text-3)',
          boxShadow: status === 'live' ? '0 0 6px color-mix(in srgb, var(--ok) 60%, transparent)' : 'none',
        }} />
        {version ? `${version} · shipped ${shipped}` : 'coming soon'}
      </span>
    </a>
  );
}
