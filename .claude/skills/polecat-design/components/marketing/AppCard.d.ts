/** Props for {@link AppCard} — one tile in the polecat.live launcher grid (site.css `.app-card`).
 *
 * Border-first card. On hover it lifts 3px, the border warms to a 45% accent
 * mix, an accent wash breathes in from the top-left, a shine sweeps across, the
 * glyph pops, and the ↗ slides in. Version and ship date come from the app's
 * live changelog — never hand-typed.
 */
export interface AppCardProps {
  /** Fleet id — supplies the accent pair. */
  app: string;
  glyph: string;
  name: string;
  /** e.g. analytics.polecat.live */
  host: string;
  tagline: string;
  version?: string;
  shipped?: string;
  status?: 'live' | 'soon';
  /** Small uppercase accent tag, e.g. FUN. */
  fun?: string;
  /** Force the hover treatment (for specimens and screenshots). */
  hover?: boolean;
  style?: React.CSSProperties;
}
export declare function AppCard(props: AppCardProps): JSX.Element;
