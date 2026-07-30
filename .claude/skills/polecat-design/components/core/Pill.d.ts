/** Props for {@link Pill} — a toggleable filter control (shell.css `.pill` / `.filter-chip`). */
export interface PillProps {
  /** On fills the pill with the brand→accent gradient and drops the border. */
  on?: boolean;
  /** Optional match count, rendered as a 16%-currentColor inner badge. */
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Pill(props: PillProps): JSX.Element;
