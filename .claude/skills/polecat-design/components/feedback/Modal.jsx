import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* Modal — centred dialog on a blurred scrim (shell.css `.modal`).
   20px radius, 560px default (`wide` 920, `full` 1100×90vh); becomes a
   full-screen sheet below 520px. */
export function Modal({ title, titleIcon, size = 'md', footer, onClose, children, style, ...rest }) {
  const w = { md: 'min(560px,100%)', wide: 'min(920px,100%)', full: 'min(1100px,100%)' }[size];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(6,4,20,.6)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'grid', placeItems: 'center', padding: 20,
    }} {...rest}>
      <div role="dialog" aria-modal="true" style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)', width: w, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        height: size === 'full' ? '90vh' : undefined, ...style,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 16, flex: 1 }}>
            {titleIcon}{title}
          </div>
          {onClose && <IconButton variant="ghost" size="sm" label="Close" icon="✕" onClick={onClose} />}
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 20px',
            borderTop: '1px solid var(--border)', flexWrap: 'wrap',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
