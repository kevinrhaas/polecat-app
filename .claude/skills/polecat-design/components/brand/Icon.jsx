import React from 'react';
import { ICON_PATHS } from './iconPaths.js';

/* Icon — the fleet's own set (polecat-platform/lib/icons.js): 24×24,
   fill:none, stroke:currentColor, stroke-width 1.7, round caps.
   Never filled, never multi-color. */
export function Icon({ name, size = 20, style, ...rest }) {
  const path = ICON_PATHS[name] || ICON_PATHS.grid;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flex: 'none', ...style }}
      dangerouslySetInnerHTML={{ __html: path }} {...rest} />
  );
}
