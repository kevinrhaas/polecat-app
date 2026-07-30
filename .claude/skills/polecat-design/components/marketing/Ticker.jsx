import React from 'react';

/* Ticker — the endless drift of the tech stack (site.css `.ticker`).
   13px/700 uppercase, +1.4px, --text-3, 44px gaps with a brown middot between
   items; edge-masked with a gradient, 44s linear, paused on hover.
   The list is doubled so the loop is seamless. */
export function Ticker({ items = [], duration = 44, style, ...rest }) {
  const row = [...items, ...items];
  return (
    <div aria-hidden="true" style={{
      overflow: 'hidden', borderBlock: '1px solid var(--border)', padding: '13px 0', position: 'relative',
      WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
      maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)', ...style,
    }} {...rest}>
      <div style={{
        display: 'flex', gap: 44, width: 'max-content',
        animation: `pcTickerRoll ${duration}s linear infinite`,
      }}>
        {row.map((t, i) => (
          <span key={i} style={{
            fontSize: 'var(--t-ticker)', fontWeight: 700, letterSpacing: 'var(--t-ticker-ls)',
            textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap', position: 'relative',
          }}>{t}
            <span style={{ position: 'absolute', right: -26, color: 'var(--brand-a)', opacity: 0.6 }}>·</span>
          </span>
        ))}
      </div>
      <style>{'@keyframes pcTickerRoll{to{transform:translateX(-50%)}}'}</style>
    </div>
  );
}
