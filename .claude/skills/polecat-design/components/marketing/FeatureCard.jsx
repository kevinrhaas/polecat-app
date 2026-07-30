import React from 'react';

/* FeatureCard — the site's workhorse content card (site.css `.method` / `.xp`).
   1px border, 16px radius, 22px padding, bold title over muted body, an accent
   wash on hover, and an optional big ghost number in the top-right corner. */
export function FeatureCard({ num, title, children, hover, style, ...rest }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', background: 'var(--surface)',
      borderRadius: 'var(--r)', padding: 22, fontSize: 14, color: 'var(--text-2)',
      display: 'flex', flexDirection: 'column', gap: 8,
      border: '1px solid ' + (hover ? 'color-mix(in srgb, var(--brand-b) 40%, var(--border))' : 'var(--border)'),
      transform: hover ? 'translateY(-2px)' : 'none',
      transition: 'border-color var(--d-hover), transform var(--d-hover)', ...style,
    }} {...rest}>
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: hover ? 1 : 0,
        background: 'radial-gradient(120% 90% at 15% 0%, rgba(224,138,69,.10), transparent 60%)',
        transition: 'opacity var(--d-panel)',
      }} />
      {num && (
        <i style={{
          position: 'absolute', top: 10, right: 16, fontStyle: 'normal', fontWeight: 800,
          fontSize: 40, letterSpacing: '-2px', lineHeight: 1, opacity: hover ? 1 : 0.5,
          transform: hover ? 'scale(1.08) rotate(3deg)' : 'none',
          background: 'linear-gradient(150deg, color-mix(in srgb, var(--brand-b) 55%, transparent), color-mix(in srgb, #b070f0 35%, transparent))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          transition: 'opacity var(--d-panel), transform var(--d-panel)',
        }}>{num}</i>
      )}
      <b style={{ color: 'var(--text)', fontSize: 15.5 }}>{title}</b>
      <span>{children}</span>
    </div>
  );
}
