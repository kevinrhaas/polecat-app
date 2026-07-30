/** Props for {@link StatCard} — one of the four proof numbers (site.css `.stat`).
 *
 * Gradient number over an uppercase caption; lifts 3px and takes a shine sweep
 * on hover. Each one links somewhere that substantiates it.
 */
export interface StatCardProps {
  value: React.ReactNode;
  label: string;
  href?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
