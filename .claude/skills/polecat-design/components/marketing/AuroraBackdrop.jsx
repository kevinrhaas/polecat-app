import React from 'react';

/* AuroraBackdrop — the atmosphere layer behind every marketing page:
   three 60vmax blurred colour fields on `mix-blend-mode: screen` drifting on a
   30s loop, plus the film-grain tile at .05 above content. Both go silent under
   prefers-reduced-motion. Mount once, at the top of the page. */
export function AuroraBackdrop({ grain = true, style, ...rest }) {
  const blob = (bg, pos, extra) => ({
    position: 'absolute', width: '60vmax', height: '60vmax', borderRadius: '50%',
    background: bg, filter: 'blur(90px)', opacity: 0.28, mixBlendMode: 'screen',
    animation: 'pcDrift 30s ease-in-out infinite', ...pos, ...extra,
  });
  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -2, overflow: 'hidden', pointerEvents: 'none', ...style }} {...rest}>
        <span style={blob('#b070f0', { top: '-24vmax', left: '-14vmax' })} />
        <span style={blob('var(--brand-b)', { bottom: '-28vmax', right: '-12vmax' }, { animationDelay: '-10s' })} />
        <span style={blob('var(--blush)', { top: '26vmax', right: '22vmax' }, { opacity: 0.18, animationDelay: '-18s' })} />
      </div>
      {grain && (
        <div aria-hidden="true" style={{
          position: 'fixed', inset: '-50%', zIndex: 60, pointerEvents: 'none', opacity: 0.05,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")",
          animation: 'pcGrainShift 1.2s steps(4) infinite',
        }} />
      )}
      <style>{`@keyframes pcDrift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(7vmax,4vmax) scale(1.12)}66%{transform:translate(-5vmax,3vmax) scale(.95)}}
@keyframes pcGrainShift{0%,100%{transform:translate(0,0)}25%{transform:translate(-1.2%,.8%)}50%{transform:translate(.9%,-1%)}75%{transform:translate(-.7%,-.6%)}}
@media (prefers-reduced-motion:reduce){[style*="pcDrift"],[style*="pcGrainShift"]{animation:none!important}}`}</style>
    </>
  );
}
