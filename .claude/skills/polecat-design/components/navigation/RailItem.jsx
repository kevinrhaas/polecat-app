import React from 'react';

/* RailItem — one rail row. Active state is a 16% rail-accent wash plus a 3px
   gradient bar bleeding off the left edge (shell.css `.ps-rail-item.active`). */
export function RailItem({ icon, label, active, badge, badgeTone, open = true, onClick, style, ...rest }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 10,
        border: 'none', cursor: 'pointer', width: '100%', position: 'relative', minHeight: 38,
        background: active ? 'color-mix(in srgb, var(--rail-accent) 16%, transparent)' : 'none',
        color: active ? 'var(--text)' : 'var(--text-2)', fontFamily: 'inherit',
        transition: 'background var(--d-fast), color var(--d-fast)', ...style,
      }} {...rest}>
      {active && <span style={{
        content: '""', position: 'absolute', left: -10, top: 8, bottom: 8, width: 3, borderRadius: 3,
        background: 'linear-gradient(var(--brand),var(--accent))',
      }} />}
      {icon}
      <span style={{
        opacity: open ? 1 : 0, transition: 'opacity var(--d-panel)', whiteSpace: 'nowrap',
        fontWeight: 600, fontSize: 'var(--t-control)',
      }}>{label}</span>
      {badge != null && open && (
        <span style={{
          marginLeft: 'auto', background: badgeTone === 'danger' ? 'var(--danger)' : 'var(--accent)',
          color: '#fff', fontSize: 'var(--t-badge)', fontWeight: 700, minWidth: 18, height: 18,
          borderRadius: 9, display: 'grid', placeItems: 'center', padding: '0 5px',
        }}>{badge}</span>
      )}
    </button>
  );
}
