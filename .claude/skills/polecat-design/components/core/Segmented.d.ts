/** Props for {@link Segmented} — the uiMode picker (shell.css `.ps-seg`). */
export interface SegmentedProps {
  options: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export declare function Segmented(props: SegmentedProps): JSX.Element;
