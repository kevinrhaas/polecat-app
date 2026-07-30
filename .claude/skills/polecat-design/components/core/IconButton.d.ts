/** Props for {@link IconButton} — a square icon-only control (shell.css `.btn.icon`). */
export interface IconButtonProps {
  icon: React.ReactNode;
  /** Required — becomes both aria-label and title. */
  label: string;
  /** sm 32px · md 38px · lg 44px (the mobile tap floor). */
  size?: 'sm' | 'md' | 'lg';
  variant?: 'secondary' | 'ghost';
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
