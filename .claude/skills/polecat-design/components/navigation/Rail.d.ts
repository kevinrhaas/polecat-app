/** Props for {@link Rail} and {@link RailGroup} — the in-app left navigation (shell.css `.ps-rail`).
 *
 * 66px collapsed → 232px open over .22s `cubic-bezier(.4,0,.2,1)`; labels
 * cross-fade over .2s. Below 860px it becomes a fixed overlay drawer with a
 * backdrop and the toggle stays as the only close affordance.
 */
export interface RailProps {
  /** Fleet app id — drives the brand tile's accent. */
  app?: string;
  /** The app's catalog glyph. */
  glyph: string;
  name: string;
  open?: boolean;
  /** The barely-there polecat.live link under the app name (.45 → .9 on hover). */
  suiteLink?: boolean;
  footer?: React.ReactNode;
  onToggle?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Rail(props: RailProps): JSX.Element;
export declare function RailGroup(props: { open?: boolean; children?: React.ReactNode }): JSX.Element;
