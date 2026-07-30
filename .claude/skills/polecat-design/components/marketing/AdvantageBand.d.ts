/** Props for {@link AdvantageBand} — the one gradient-bordered card in the system
 * (site.css `.adv`).
 *
 * Padding-box/border-box double background, a 6s breathing glow, and a row of
 * cream pills that lift and tilt -1deg on hover. Use it once per page, for the
 * single claim the page is actually making.
 */
export interface AdvantageBandProps {
  kicker?: string;
  lead?: React.ReactNode;
  pills?: string[];
  foot?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function AdvantageBand(props: AdvantageBandProps): JSX.Element;
