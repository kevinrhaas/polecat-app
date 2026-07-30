/** Props for {@link Toggle} — the settings switch (shell.css `.ps-toggle`). 44×24 track, 18px knob. */
export interface ToggleProps {
  on?: boolean;
  /** Required for a11y — this renders as role="switch" with no visible text. */
  label: string;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Toggle(props: ToggleProps): JSX.Element;
