/** Props for {@link Topbar} — the persistent app header (shell.css `.ps-topbar`).
 *
 * Section name at the left (the app's identity lives in the rail, not here),
 * the ⌘K command search centred, actions right. 70% surface + blur(12px).
 */
export interface TopbarProps {
  /** Current section name — updated by the shell's setActive(). */
  section: string;
  /** Mode chips shown only while active: Simple mode, LIVE, Saved ✓. */
  badges?: React.ReactNode;
  search?: boolean;
  onSearch?: () => void;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Topbar(props: TopbarProps): JSX.Element;
