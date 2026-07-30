/** Props for {@link Chip} — a static, non-interactive label (shell.css `.chip`, `.wn-kind`). */
export interface ChipProps {
  /** Semantic tint at 14%: feature=green, fix=red, polish=blue, warn=amber. */
  tone?: 'neutral' | 'feature' | 'fix' | 'polish' | 'warn';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Chip(props: ChipProps): JSX.Element;
