import React from 'react';

/* IconButton — a square icon-only control. shell.css `.btn.icon`
   (38×38, 32×32 small, 44×44 at the mobile tap floor). */
export function IconButton({ icon, label, size = 'md', variant = 'secondary', active, disabled, onClick, style, ...rest }) {
  const s = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;
  const skin = variant === 'ghost'
    ? { background: active ? 'var(--surface-2)' : 'transparent', borderColor: 'transparent' }
    : { background: active ? 'var(--surface-3)' : 'var(--surface-2)', borderColor: 'var(--border)' };
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      style={{
        width: s, height: s, padding: 0, flex: 'none', display: 'inline-grid', placeItems: 'center',
        borderRadius: 'var(--radius-sm)', border: '1px solid transparent',
        color: active ? 'var(--text)' : 'var(--text-2)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--d-hover), border-color var(--d-hover), color var(--d-hover)',
        ...skin, ...style,
      }} {...rest}>{icon}</button>
  );
}
