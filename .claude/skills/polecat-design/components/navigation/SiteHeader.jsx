import React from 'react';
import { GlyphTile } from '../brand/GlyphTile.jsx';
import { Wordmark } from '../brand/Wordmark.jsx';

/* SiteHeader — the shared marketing chrome every app front door mounts
   (site-chrome.css `.psx-header`). Left: the app's glyph tile + name. Centre:
   the app's own sections. Right: the accent CTA, then the muted "Polecat ↗"
   suite link — same place, same treatment, on every app. */
export function SiteHeader({ app, glyph, name, accent, nav = [], cta, suiteLink = true, style, ...rest }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100, background: 'var(--psx-bg)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--psx-border)',
      fontFamily: 'var(--font-site)', ...style,
    }} {...rest}>
      <div style={{
        maxWidth: 'var(--maxw)', margin: '0 auto', padding: '11px 22px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          color: 'var(--text)', fontWeight: 800, fontSize: 16, letterSpacing: '-.3px',
        }}>
          <GlyphTile app={app} glyph={glyph} accent={accent} size={30} />
          <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 14 }}>
          {nav.map(n => (
            <a key={n.label} href={n.href} style={{ color: 'var(--text-2)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{n.label}</a>
          ))}
          {cta && (
            <a href={cta.href} target="_blank" rel="noopener" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px',
              borderRadius: 'var(--r-pill)', fontWeight: 700, fontSize: 14, color: '#fff',
              textDecoration: 'none', background: accent || 'var(--brand-b)',
              boxShadow: `0 6px 18px color-mix(in srgb, ${accent || 'var(--brand-b)'} 34%, transparent)`,
              transition: 'transform var(--d-fast)',
            }}>{cta.label}</a>
          )}
          {suiteLink && <Wordmark variant="suite" />}
        </div>
      </div>
    </header>
  );
}
