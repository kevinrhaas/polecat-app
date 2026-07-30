import React from 'react';
import { GlyphTile, FLEET_ACCENTS } from '../brand/GlyphTile.jsx';
import { Chip } from '../core/Chip.jsx';

export const FLEET = [
  { id: 'chat', name: 'Chat', glyph: 'chat' },
  { id: 'jobtracker', name: 'JobTracker', glyph: 'briefcase' },
  { id: 'analytics', name: 'Analytics', glyph: 'chart' },
  { id: 'autoselector', name: 'AutoSelector', glyph: 'car' },
  { id: 'relay', name: 'Relay', glyph: 'network' },
  { id: 'games', name: 'Games', glyph: 'gamepad' },
  { id: 'manager', name: 'Manager', glyph: 'gauge' },
  { id: 'modelserver', name: 'Model Server', glyph: 'terminal' },
];

/* Waffle — the fleet app switcher popover (shell.css `.ps-waffle-pop`).
   3-up grid of glyph tiles; the current app gets a 45% brand border. */
export function Waffle({ current, apps = FLEET, onPick, style, ...rest }) {
  return (
    <div role="menu" style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', padding: 12, width: 'min(320px,92vw)', ...style,
    }} {...rest}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
        color: 'var(--text-3)', padding: '0 4px 8px',
      }}>Polecat suite</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {apps.map(a => {
          const on = a.id === current;
          return (
            <button key={a.id} type="button" onClick={() => onPick && onPick(a)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              padding: '12px 6px 10px', borderRadius: 11, cursor: 'pointer', textAlign: 'center',
              color: 'var(--text)', fontFamily: 'inherit',
              border: '1px solid ' + (on ? 'color-mix(in srgb, var(--brand) 45%, var(--border))' : 'transparent'),
              background: on ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'none',
            }}>
              <GlyphTile app={a.id} glyph={a.glyph} size={38} />
              <span style={{
                fontSize: 11.5, fontWeight: 600, lineHeight: 1.2, maxWidth: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{a.name}</span>
              {a.soon && <Chip style={{ fontSize: 9.5, padding: '1px 7px' }}>soon</Chip>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { FLEET_ACCENTS };
