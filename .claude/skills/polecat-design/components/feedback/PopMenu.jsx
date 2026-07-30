import React from 'react';

/* PopMenu — the anchored action menu (shell.css `.pop-menu`). 6px padding,
   190px min width, 8px rows, pops in over .12s. Group headings and separators
   match the app's `⋯ More` menu. */
export function PopMenu({ items = [], onPick, style, ...rest }) {
  return (
    <div role="menu" style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', padding: 6, minWidth: 190, display: 'flex',
      flexDirection: 'column', gap: 2, ...style,
    }} {...rest}>
      {items.map((it, i) => {
        if (it === '-' || it.sep) return <div key={i} style={{ height: 1, background: 'var(--border)', margin: '5px 4px' }} />;
        if (it.group) return (
          <div key={i} style={{
            fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
            color: 'var(--text-3)', padding: '8px 11px 4px',
          }}>{it.group}</div>
        );
        return (
          <button key={i} type="button" role="menuitem" onClick={() => onPick && onPick(it)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 11px',
            border: 'none', background: 'none', color: 'var(--text)', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit',
          }}>{it.icon}<span style={{ flex: 1 }}>{it.label}</span>{it.hint && (
            <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>{it.hint}</span>
          )}</button>
        );
      })}
    </div>
  );
}
