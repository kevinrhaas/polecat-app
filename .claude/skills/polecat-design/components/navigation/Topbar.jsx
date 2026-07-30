import React from 'react';
import { Icon } from '../brand/Icon.jsx';
import { Kbd } from '../core/Kbd.jsx';

/* Topbar — the persistent app header (shell.css `.ps-topbar`): section name at
   the left, the ⌘K command search in the centre, actions at the right. 70%
   surface with blur(12px). */
export function Topbar({ section, badges, search = true, onSearch, actions, style, ...rest }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
      borderBottom: '1px solid var(--border)',
      background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
      backdropFilter: 'blur(12px)', zIndex: 20, ...style,
    }} {...rest}>
      <h1 style={{ margin: 0, fontSize: 'var(--t-app-h1)', fontWeight: 700, letterSpacing: '-.01em', fontFamily: 'var(--font-display)' }}>{section}</h1>
      {badges}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {search && (
          <button type="button" onClick={onSearch} title="Search — commands, datasets, dashboards (⌘K)"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              width: 'min(360px,100%)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text-3)', fontSize: 'var(--t-control)', fontFamily: 'inherit', cursor: 'pointer',
            }}>
            <Icon name="search" size={16} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>
    </header>
  );
}
