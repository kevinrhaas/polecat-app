import React from 'react';

/* StatCard — one of the four proof numbers (site.css `.stat`). Gradient number
   over an uppercase caption; lifts and takes a shine sweep on hover.
   Never more than four, and one of them may be a joke that is also true. */
export function StatCard({ value, label, href = '#', hover, style, ...rest }) {
  return (
    <a href={href} style={{
      display: 'block', background: 'var(--surface)', borderRadius: 'var(--r)',
      padding: '20px 12px', textAlign: 'center', textDecoration: 'none', color: 'inherit',
      position: 'relative', overflow: 'hidden',
      border: '1px solid ' + (hover ? 'color-mix(in srgb, var(--brand-b) 40%, var(--border))' : 'var(--border)'),
      transform: hover ? 'translateY(-3px)' : 'none',
      transition: 'transform var(--d-hover), border-color var(--d-hover)', ...style,
    }} {...rest}>
      <b style={{
        display: 'block', fontSize: 'var(--t-stat)', fontWeight: 800, letterSpacing: '-1px',
        background: 'linear-gradient(110deg, var(--brand-b), var(--blush))',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{value}</b>
      <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-3)' }}>{label}</span>
    </a>
  );
}
