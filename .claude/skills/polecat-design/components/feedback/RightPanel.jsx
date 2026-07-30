import React from 'react';
import { IconButton } from '../core/IconButton.jsx';

/* RightPanel — the slide-in detail panel (shell.css `.ps-rpanel`).
   420px from the right edge over a 45% scrim, .24s cubic-bezier(.2,.8,.3,1).
   Full width below 520px. */
export function RightPanel({ title, open = true, onClose, children, style, ...rest }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(6,4,20,.45)',
        backdropFilter: 'blur(2px)', opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none', transition: 'opacity var(--d-panel)',
      }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 95, width: 'var(--panel-w)',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'none' : 'translateX(102%)',
        transition: 'transform var(--d-sheet) var(--e-panel)', ...style,
      }} {...rest}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)', flex: 'none' }}>
          <h2 style={{
            margin: 0, fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</h2>
          {onClose && <IconButton variant="ghost" size="sm" label="Close panel" icon="✕" onClick={onClose} />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>{children}</div>
      </aside>
    </>
  );
}
