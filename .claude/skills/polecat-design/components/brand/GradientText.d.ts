/** Props for {@link GradientText} — the house gradient clipped to text (site.css `.grad`). */
export interface GradientTextProps {
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function GradientText(props: GradientTextProps): JSX.Element;
