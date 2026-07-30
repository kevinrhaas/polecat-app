import React from 'react';
import { GradientText } from './GradientText.jsx';

/* Wordmark — "Pole" in --text, "cat" in the house gradient, 800 weight.
   `variant="suite"` is the muted "Polecat ↗" back-to-the-suite link every app
   front door carries at the right edge of its header. */
export function Wordmark({ size = 17, mark, variant = 'default', href = 'https://polecat.live', style, ...rest }) {
  if (variant === 'suite') {
    return (
      <a href={href} style={{
        fontWeight: 800, fontSize: 14, letterSpacing: '-.2px', whiteSpace: 'nowrap',
        color: 'var(--text-3)', textDecoration: 'none', opacity: 0.85,
        transition: 'opacity var(--d-fast)', ...style,
      }} {...rest}>Polecat<span style={{ fontWeight: 400, fontSize: 12, marginLeft: 3 }}>↗</span></a>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800,
      fontSize: size, letterSpacing: size > 19 ? '-.6px' : '-.4px', color: 'var(--text)', ...style,
    }} {...rest}>
      {mark && <img src={mark} width={Math.round(size * 1.5)} height={Math.round(size * 1.5)} alt="" style={{ display: 'block' }} />}
      <span>Pole<GradientText>cat</GradientText></span>
    </span>
  );
}
