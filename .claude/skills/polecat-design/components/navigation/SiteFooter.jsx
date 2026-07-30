import React from 'react';
import { GlyphTile } from '../brand/GlyphTile.jsx';
import { Wordmark } from '../brand/Wordmark.jsx';

const dot = <span aria-hidden="true" style={{ color: 'var(--text-3)', opacity: 0.6 }}>·</span>;

/* SiteFooter — two lines, one wording, every app (site-chrome.css `.psx-footer`):
   line 1 `AppName · part of the polecat.live suite`, line 2
   `Docs · App · Third-party notices · © YEAR Polecat.live`.
   `variant="root"` is polecat.live's own: the sharp wordmark on top, a suite
   links row, no "part of the suite" line, and no What's-new link. */
export function SiteFooter({ app, glyph, name, accent, links = [], year = 2026, variant = 'app', suiteLinks = [], style, ...rest }) {
  const wrap = {
    borderTop: '1px solid var(--psx-border)', background: 'var(--psx-solid)',
    color: 'var(--text-2)', fontFamily: 'var(--font-site)', ...style,
  };
  const inner = {
    maxWidth: 'var(--maxw)', margin: '0 auto', padding: variant === 'root' ? '30px 22px' : '26px 22px',
    display: 'flex', flexDirection: 'column', gap: variant === 'root' ? 14 : 10,
    alignItems: 'center', textAlign: 'center',
  };
  if (variant === 'root') {
    return (
      <footer style={wrap} {...rest}><div style={inner}>
        <Wordmark size={22} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 14 }}>
          {suiteLinks.map((l, i) => (
            <React.Fragment key={l.label}>{i > 0 && dot}
              <a href={l.href} style={{ color: 'var(--text-2)', textDecoration: 'none' }}>{l.label}</a>
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>© {year} Polecat.live · Chicago</div>
      </div></footer>
    );
  }
  return (
    <footer style={wrap} {...rest}><div style={inner}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
          <GlyphTile app={app} glyph={glyph} accent={accent} size={24} />{name}
        </span>
        <span style={{ fontSize: 14 }}>part of the{' '}
          <a href="https://polecat.live" style={{
            color: 'var(--text-2)', textDecoration: 'none',
            borderBottom: `1px solid color-mix(in srgb, ${accent || 'var(--brand-b)'} 55%, transparent)`,
          }}>polecat.live</a> suite
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, color: 'var(--text-3)' }}>
        {links.map(l => (
          <React.Fragment key={l.label}>
            <a href={l.href} style={{ color: 'var(--text-2)', textDecoration: 'none' }}>{l.label}</a>{dot}
          </React.Fragment>
        ))}
        <span>© {year} Polecat.live</span>
      </div>
    </div></footer>
  );
}
