import React from 'react';

/* Kicker — the uppercase section eyebrow with its 26×3 gradient tick.
   12px / 800 / +1.5px, in --brand-b. Every section on the site opens with one. */
export function Kicker({ children, tick = true, style, ...rest }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8,
      fontSize: 'var(--t-kicker)', fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: 'var(--t-kicker-ls)', color: 'var(--brand-b)', ...style,
    }} {...rest}>
      {tick && <span style={{ width: 26, height: 3, borderRadius: 2, background: 'var(--pc-gradient)', flex: 'none' }} />}
      {children}
    </div>
  );
}
