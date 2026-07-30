import React from 'react';

/* Field — the label + control + hint stack (shell.css `.field`).
   Labels are 12px/600 in --text-2; hints are 11.5px in --text-3. */
export function Field({ label, hint, children, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, ...style }} {...rest}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.02em' }}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  );
}

/* FieldRow — side-by-side fields that stack below 520px (min-width 160px each). */
export function FieldRow({ children, style, ...rest }) {
  return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', ...style }} {...rest}>{children}</div>;
}
