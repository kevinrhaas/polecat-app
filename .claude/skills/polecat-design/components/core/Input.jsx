import React from 'react';

const box = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
  fontSize: 'var(--t-control)', fontFamily: 'inherit',
  transition: 'border-color var(--d-hover), box-shadow var(--d-hover)',
};

/* Input — shell.css `.input`. Focus grows a 3px brand ring; the border never shifts. */
export function Input({ style, ...rest }) {
  return <input style={{ ...box, ...style }} {...rest} />;
}

/* Textarea — vertical resize only, 1.55 line-height. */
export function Textarea({ rows = 4, style, ...rest }) {
  return <textarea rows={rows} style={{ ...box, resize: 'vertical', lineHeight: 1.55, ...style }} {...rest} />;
}

/* Select — native select with the shell's own chevron (no OS arrow). */
export function Select({ options = [], children, style, ...rest }) {
  return (
    <select style={{
      ...box, cursor: 'pointer', appearance: 'none', paddingRight: 30,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a95c8' stroke-width='2.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', ...style,
    }} {...rest}>
      {children || options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}
