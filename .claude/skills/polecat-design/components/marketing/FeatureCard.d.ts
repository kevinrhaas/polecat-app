/** Props for {@link FeatureCard} — the site's workhorse content card
 * (site.css `.method` / `.xp`).
 *
 * Bold title over muted body, accent wash on hover, and an optional big ghost
 * number in the top-right that brightens and tilts 3deg on hover.
 */
export interface FeatureCardProps {
  /** Two-digit ordinal, e.g. "01" — used in the "How we build" grid. */
  num?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  hover?: boolean;
  style?: React.CSSProperties;
}
export declare function FeatureCard(props: FeatureCardProps): JSX.Element;
