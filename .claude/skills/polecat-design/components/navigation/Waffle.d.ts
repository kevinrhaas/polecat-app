/** Props for {@link Waffle} — the fleet app switcher popover (shell.css `.ps-waffle-pop`).
 *
 * 3-up grid of glyph tiles; the current app carries a 45% brand border and a
 * 10% brand wash. Renders from the catalog, so adding an app is one entry.
 */
export interface WaffleApp { id: string; name: string; glyph: string; soon?: boolean }
export interface WaffleProps {
  /** Fleet id of the app you're currently in. */
  current?: string;
  apps?: WaffleApp[];
  onPick?: (app: WaffleApp) => void;
  style?: React.CSSProperties;
}
export declare function Waffle(props: WaffleProps): JSX.Element;
export declare const FLEET: WaffleApp[];
