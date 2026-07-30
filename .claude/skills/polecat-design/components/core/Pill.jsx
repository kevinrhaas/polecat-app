import React from 'react';

/* Pill — a toggleable filter control (shell.css `.pill` / `.filter-chip`).
   `on` fills it with the brand→accent gradient. */
export function Pill({ on, count, icon, disabled, onClick, children, style, ...rest }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={!!on}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px',
        borderRadius: 'var(--radius-pill)', fontSize: 'var(--t-pill)', fontWeight: 600,
        fontFamily: 'inherit', border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
        background: on ? 'linear-gradient(135deg,var(--brand),var(--accent))' : 'var(--surface-2)',
        color: on ? '#fff' : 'var(--text-2)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'all var(--d-fast)', ...style,
      }} {...rest}>
      {icon}{children}
      {count != null && (
        <span style={{
          fontSize: 10.5, fontWeight: 700, borderRadius: 'var(--radius-pill)', padding: '1px 6px',
          background: 'color-mix(in srgb, currentColor 16%, transparent)',
        }}>{count}</span>
      )}
    </button>
  );
}
