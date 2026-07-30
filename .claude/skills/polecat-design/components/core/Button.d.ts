/** Props for {@link Button} — the fleet's primary action control.
 *
 * Two surfaces, deliberately different: `site` is a full pill with the house
 * gradient and a lift on hover (site.css `.btn`); `app` is a 9px-radius,
 * surface-2 control (shell.css `.btn`).
 */
export interface ButtonProps {
  /** primary = gradient fill; ghost = bordered/transparent; danger = red mix. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** lg is site-only (16px / 13px 26px). */
  size?: 'sm' | 'md' | 'lg';
  /** 'site' for marketing pages, 'app' inside the Polecat Shell. */
  surface?: 'site' | 'app';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  block?: boolean;
  href?: string;
  as?: 'button' | 'a' | 'span';
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
