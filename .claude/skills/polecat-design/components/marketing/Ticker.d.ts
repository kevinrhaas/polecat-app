/** Props for {@link Ticker} — the endless drift of the tech stack (site.css `.ticker`).
 *
 * 13px/700 uppercase +1.4px in --text-3, 44px gaps with a brown middot between
 * items, edge-masked with a gradient, 44s linear, paused on hover. The list is
 * doubled internally so the loop is seamless.
 */
export interface TickerProps {
  items: string[];
  /** Seconds for one full pass. Default 44. */
  duration?: number;
  style?: React.CSSProperties;
}
export declare function Ticker(props: TickerProps): JSX.Element;
