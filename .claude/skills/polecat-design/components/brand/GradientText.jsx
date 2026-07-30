import React from 'react';

/* GradientText — the one house gradient, clipped to text. Used on the
   wordmark's "cat", stat numbers, and hero emphasis. Nothing else. */
export function GradientText({ as = 'span', children, style, ...rest }) {
  const Tag = as;
  return (
    <Tag style={{
      background: 'var(--pc-gradient)', backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
      ...style,
    }} {...rest}>{children}</Tag>
  );
}
