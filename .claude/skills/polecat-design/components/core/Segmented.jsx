import React from 'react';

/* Segmented — the uiMode picker (shell.css `.ps-seg`): simple / standard / expert.
   Hairline dividers between options; the active segment takes the gradient. */
export function Segmented({ options = [], value, onChange, style, ...rest }) {
  return (
    <div role="tablist" style={{
      display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 10,
      overflow: 'hidden', background: 'var(--surface-2)', ...style,
    }} {...rest}>
      {options.map((o, i) => {
        const v = o.value ?? o, on = v === value;
        return (
          <button key={v} type="button" role="tab" aria-selected={on} onClick={() => onChange && onChange(v)}
            style={{
              padding: '7px 14px', border: 'none', background: on ? 'linear-gradient(135deg,var(--brand),var(--accent))' : 'none',
              color: on ? '#fff' : 'var(--text-2)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer', borderRight: i < options.length - 1 ? '1px solid var(--border)' : 'none',
            }}>{o.label ?? o}</button>
        );
      })}
    </div>
  );
}
