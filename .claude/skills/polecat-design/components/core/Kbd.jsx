import React from 'react';

/* Kbd — a keyboard hint. Mono, 11px, surface-3 chip (shell.css `kbd`). */
export function Kbd({ children, style, ...rest }) {
  return (
    <kbd style={{
      fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface-3)',
      border: '1px solid var(--border)', borderRadius: 6, padding: '1px 6px',
      color: 'var(--text-2)', ...style,
    }} {...rest}>{children}</kbd>
  );
}
