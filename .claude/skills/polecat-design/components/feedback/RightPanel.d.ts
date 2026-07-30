/** Props for {@link RightPanel} — the slide-in detail panel (shell.css `.ps-rpanel`).
 *
 * 420px from the right over a 45% scrim, .24s `cubic-bezier(.2,.8,.3,1)`.
 * Full width below 520px. Safe-area aware top and bottom.
 */
export interface RightPanelProps {
  title: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function RightPanel(props: RightPanelProps): JSX.Element;
