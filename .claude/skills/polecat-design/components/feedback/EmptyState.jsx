import React from 'react';

/* EmptyState — the centred "nothing here yet" panel (`.sec-empty`, `#canvasEmpty`).
   Copy is instructional and lowercase-plain: say what to do next. */
export function EmptyState({ icon, title, description, actions, style, ...rest }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '46px 20px', gap: 10, ...style,
    }} {...rest}>
      {icon && <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {description && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', maxWidth: 420, lineHeight: 1.55 }}>{description}</p>
      )}
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>{actions}</div>}
    </div>
  );
}
