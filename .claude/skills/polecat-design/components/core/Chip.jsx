import React from 'react';

/* Chip — a static, non-interactive label (shell.css `.chip`, `.wn-kind`).
   `tone` tints it with a semantic hue at 14%. */
export function Chip({ tone = 'neutral', icon, children, style, ...rest }) {
  const hue = { feature: 'var(--pc-success)', fix: 'var(--pc-danger)', polish: 'var(--pc-info)', warn: 'var(--pc-warning)' }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px',
      borderRadius: 'var(--radius-pill)', fontSize: 'var(--t-chip)', fontWeight: 600,
      background: hue ? `color-mix(in srgb, ${hue} 14%, transparent)` : 'var(--surface-3)',
      color: hue || 'var(--text-2)', whiteSpace: 'nowrap', ...style,
    }} {...rest}>{icon}{children}</span>
  );
}
