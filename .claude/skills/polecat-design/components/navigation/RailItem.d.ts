/** Props for {@link RailItem} — one rail row.
 *
 * Active = 16% rail-accent wash + a 3px gradient bar bleeding off the left edge.
 */
export interface RailItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  /** Count badge (accent fill; `badgeTone="danger"` turns it red). */
  badge?: number | string;
  badgeTone?: 'accent' | 'danger';
  /** Pass the rail's open state so the label fades in sync. */
  open?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function RailItem(props: RailItemProps): JSX.Element;
