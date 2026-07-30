import React from 'react';

/* Toggle — the settings switch (shell.css `.ps-toggle`). 44×24 track,
   18px knob, gradient when on. */
export function Toggle({ on, label, onChange, disabled, style, ...rest }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} disabled={disabled}
      onClick={() => onChange && onChange(!on)}
      style={{
        position: 'relative', width: 44, height: 24, padding: 0, flex: 'none',
        borderRadius: 'var(--radius-pill)', cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid ' + (on ? 'transparent' : 'var(--border)'),
        background: on ? 'linear-gradient(135deg,var(--brand),var(--accent))' : 'var(--surface-3)',
        transition: 'background var(--d-hover), border-color var(--d-hover)',
        opacity: disabled ? 0.4 : 1, ...style,
      }} {...rest}>
      <span style={{
        position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%',
        background: on ? '#fff' : 'var(--text-2)',
        transform: on ? 'translateX(20px)' : 'none',
        transition: 'transform 180ms, background var(--d-hover)',
      }} />
    </button>
  );
}
