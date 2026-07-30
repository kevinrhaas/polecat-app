import React from 'react';

/* Button — the fleet's primary action. Two surfaces:
   `site` = full pill, gradient primary, lift on hover (site.css .btn)
   `app`  = 9px radius, surface-2 fill, gradient primary (shell.css .btn) */
export function Button({
  variant = 'primary', size = 'md', surface = 'site', icon, iconRight,
  disabled, block, as = 'button', href, onClick, children, style, ...rest
}) {
  const site = surface === 'site';
  const pad = site
    ? (size === 'lg' ? '13px 26px' : size === 'sm' ? '8px 14px' : '10px 18px')
    : (size === 'sm' ? '6px 11px' : '8px 14px');
  const base = {
    display: block ? 'flex' : 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: site ? 6 : 7, padding: pad, width: block ? '100%' : undefined,
    borderRadius: site ? 'var(--r-pill)' : 'var(--radius-sm)',
    fontFamily: 'inherit', fontWeight: site ? 700 : 600,
    fontSize: site ? (size === 'lg' ? 16 : 14) : (size === 'sm' ? 12.5 : 13.5),
    lineHeight: 1.2, whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none', border: '1px solid transparent', position: 'relative',
    transition: site
      ? 'transform var(--d-fast), opacity var(--d-fast)'
      : 'transform var(--d-press), background var(--d-hover), border-color var(--d-hover), box-shadow var(--d-hover)',
    opacity: disabled ? 0.4 : 1, ...style,
  };
  const skin = {
    primary: site
      ? { background: 'var(--pc-gradient-cta)', color: '#fff', boxShadow: 'var(--shadow-cta)' }
      : { background: 'linear-gradient(135deg,var(--brand),var(--accent))', color: '#fff' },
    secondary: site
      ? { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }
      : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' },
    ghost: site
      ? { background: 'none', borderColor: 'var(--border)', color: 'var(--text-2)' }
      : { background: 'transparent', color: 'var(--text)' },
    danger: {
      background: 'color-mix(in srgb, var(--pc-danger) 18%, var(--surface-2))',
      borderColor: 'color-mix(in srgb, var(--pc-danger) 40%, var(--border))',
      color: 'var(--pc-danger)',
    },
  }[variant];
  const Tag = href ? 'a' : as;
  return (
    <Tag href={href} onClick={disabled ? undefined : onClick} disabled={Tag === 'button' ? disabled : undefined}
      style={{ ...base, ...skin }} {...rest}>
      {icon}{children}{iconRight}
    </Tag>
  );
}
