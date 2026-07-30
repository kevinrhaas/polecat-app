import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* Sheet — a side-anchored modal (shell.css `.modal.sheet`). Square corners,
   full height, 440px wide from the right; `side="bottom"` gets a 20px top
   radius and an 88vh cap. */
export function Sheet({ title, titleIcon, side = 'right', footer, onClose, children, style, ...rest }) {
  const bottom = side === 'bottom';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(6,4,20,.6)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex',
      justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
      alignItems: bottom ? 'flex-end' : 'stretch',
    }} {...rest}>
      <div role="dialog" aria-modal="true" style={{
        background: 'var(--surface)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column',
        width: bottom ? '100%' : 'min(440px,100%)', height: bottom ? 'auto' : '100%',
        maxHeight: bottom ? '88vh' : 'none',
        borderRadius: bottom ? 'var(--radius-lg) var(--radius-lg) 0 0' : 0,
        borderLeft: side === 'right' ? '1px solid var(--border)' : 'none',
        borderRight: side === 'left' ? '1px solid var(--border)' : 'none',
        borderTop: bottom ? '1px solid var(--border)' : 'none', ...style,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 16, flex: 1, minWidth: 0 }}>
            {titleIcon}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          </div>
          {onClose && <IconButton variant="ghost" size="sm" label="Close" icon="✕" onClick={onClose} />}
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 20px',
            borderTop: '1px solid var(--border)', flexWrap: 'wrap', flex: 'none',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
