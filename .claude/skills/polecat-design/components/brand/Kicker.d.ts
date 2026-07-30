/** Props for {@link Kicker} — the uppercase section eyebrow with its 26×3 gradient tick. */
export interface KickerProps {
  /** Set false to drop the gradient tick (rare). */
  tick?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Kicker(props: KickerProps): JSX.Element;
