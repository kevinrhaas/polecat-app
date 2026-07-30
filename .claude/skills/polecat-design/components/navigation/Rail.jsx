import React from 'react';
import { GlyphTile } from '../brand/GlyphTile.jsx';

/* Rail — the in-app left navigation (shell.css `.ps-rail`). 66px collapsed →
   232px open, gradient rail background, 1px right border, labels fade over
   .2s while the width animates over .22s cubic-bezier(.4,0,.2,1).
   Below 860px it becomes a fixed overlay drawer with a backdrop. */
export function Rail({ app, glyph, name, open = true, suiteLink = true, children, footer, onToggle, style, ...rest }) {
  return (
    <nav aria-label="App sections" style={{
      width: open ? 'var(--rail-w-open)' : 'var(--rail-w)', flex: 'none',
      background: 'linear-gradient(180deg,var(--rail-bg),var(--rail-bg2))',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', zIndex: 30,
      transition: 'width var(--d-panel) var(--e-standard)', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '12px 14px 10px' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '4px 0', background: 'none',
          border: 'none', cursor: 'pointer', color: 'var(--text)', width: '100%',
        }}>
          <GlyphTile app={app} glyph={glyph} size={38} />
          <b style={{
            fontSize: 15, fontFamily: 'var(--font-display)', opacity: open ? 1 : 0,
            transition: 'opacity var(--d-panel)', whiteSpace: 'nowrap',
          }}>{name}</b>
        </button>
        {suiteLink && (
          <a href="https://polecat.live" target="_blank" rel="noopener" style={{
            fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '.2px', textDecoration: 'none',
            margin: '-2px 0 0 49px', opacity: open ? 0.45 : 0, transition: 'opacity var(--d-panel)',
          }}>polecat.live</a>
        )}
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 10px 56px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>{children}</div>
      {footer}
      {onToggle && (
        <button onClick={onToggle} aria-label="Toggle navigation" aria-expanded={open} style={{
          position: 'absolute', bottom: 12, left: 14, width: 38, height: 38, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--d-panel)',
        }}>‹</button>
      )}
    </nav>
  );
}

/* RailGroup — the 10px uppercase section label; fades with the labels. */
export function RailGroup({ open = true, children }) {
  return (
    <div aria-hidden="true" style={{
      fontSize: 'var(--t-group)', textTransform: 'uppercase', letterSpacing: 'var(--t-group-ls)',
      color: 'var(--text-3)', padding: '12px 10px 4px', whiteSpace: 'nowrap',
      opacity: open ? 1 : 0, transition: 'opacity var(--d-panel)',
    }}>{children}</div>
  );
}
