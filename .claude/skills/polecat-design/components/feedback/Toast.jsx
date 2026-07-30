import React from 'react';

/* Toast — bottom-right, 4px semantic left border, overshoots in over .26s
   (shell.css `.toast`). Click to dismiss; an optional inline action link. */
export function Toast({ tone = 'brand', title, body, action, onAction, onDismiss, style, ...rest }) {
  const edge = { ok: 'var(--success)', err: 'var(--danger)', info: 'var(--info)', brand: 'var(--brand)' }[tone];
  return (
    <div role="status" onClick={onDismiss} style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${edge}`,
      borderRadius: 11, padding: '12px 15px', boxShadow: 'var(--shadow)', cursor: 'pointer',
      maxWidth: 340, ...style,
    }} {...rest}>
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{title}</div>
      {body && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3 }}>{body}</div>}
      {action && (
        <button type="button" onClick={onAction} style={{
          marginTop: 6, padding: 0, border: 'none', background: 'none', color: 'var(--brand-2)',
          cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'block', fontFamily: 'inherit',
        }}>{action}</button>
      )}
    </div>
  );
}

/* ToastStack — the fixed bottom-right region (`#toasts`), safe-area aware. */
export function ToastStack({ children, style, ...rest }) {
  return (
    <div style={{
      position: 'fixed', bottom: 'calc(20px + env(safe-area-inset-bottom,0px))',
      right: 'calc(20px + env(safe-area-inset-right,0px))', zIndex: 200,
      display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, ...style,
    }} {...rest}>{children}</div>
  );
}
