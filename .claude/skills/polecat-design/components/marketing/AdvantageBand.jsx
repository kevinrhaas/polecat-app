import React from 'react';
import { Kicker } from '../brand/Kicker.jsx';

/* AdvantageBand — the one gradient-bordered card in the system (site.css `.adv`).
   Padding-box/border-box double background, a 6s breathing glow, and a row of
   cream pills that lift and tilt -1deg on hover. Use it once per page, for the
   single claim the page is actually making. */
export function AdvantageBand({ kicker, lead, pills = [], foot, style, ...rest }) {
  return (
    <div style={{
      maxWidth: 780, margin: '44px auto 0', borderRadius: 'var(--r)', padding: 28,
      textAlign: 'center', border: '1px solid transparent',
      background: 'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(120deg, color-mix(in srgb, var(--brand-a) 70%, transparent), color-mix(in srgb, #b070f0 55%, transparent), color-mix(in srgb, var(--brand-b) 70%, transparent)) border-box',
      animation: 'pcAdvGlow 6s ease-in-out infinite', ...style,
    }} {...rest}>
      {kicker && <Kicker>{kicker}</Kicker>}
      {lead && <p style={{ color: 'var(--text-2)', fontSize: 15, maxWidth: 620, margin: '0 auto' }}>{lead}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '18px 0' }}>
        {pills.map(p => (
          <span key={p} style={{
            padding: '8px 16px', borderRadius: 'var(--r-pill)', fontSize: 13.5, fontWeight: 700,
            color: 'var(--cream)', background: 'color-mix(in srgb, var(--brand-a) 32%, transparent)',
            border: '1px solid color-mix(in srgb, var(--brand-b) 45%, transparent)',
            transition: 'transform var(--d-fast), box-shadow var(--d-fast)',
          }}>{p}</span>
        ))}
      </div>
      {foot && <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0 }}>{foot}</p>}
      <style>{'@keyframes pcAdvGlow{0%,100%{box-shadow:0 0 34px rgba(224,138,69,.10)}50%{box-shadow:0 0 54px rgba(176,112,240,.16)}}'}</style>
    </div>
  );
}
