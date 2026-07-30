import React from 'react';

/* ScrollCue — the tiny uppercase "scroll ↓" affordance under the hero
   (site.css `.scroll-cue`). 11px/800/+2.5px, --text-3, arrow bobs on 1.6s. */
export function ScrollCue({ href = '#', label = 'scroll', style, ...rest }) {
  return (
    <a href={href} aria-label={`Scroll to ${href.replace('#', '') || 'content'}`} style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 34,
      fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase',
      color: 'var(--text-3)', textDecoration: 'none', transition: 'color var(--d-panel)', ...style,
    }} {...rest}>
      {label}
      <span aria-hidden="true" style={{ fontSize: 16, animation: 'pcCueBob 1.6s ease-in-out infinite' }}>↓</span>
      <style>{'@keyframes pcCueBob{0%,100%{transform:translateY(0);opacity:.7}50%{transform:translateY(5px);opacity:1}}'}</style>
    </a>
  );
}
