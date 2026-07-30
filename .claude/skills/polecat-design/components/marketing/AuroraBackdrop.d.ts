/** Props for {@link AuroraBackdrop} — the atmosphere layer behind every marketing page.
 *
 * Three 60vmax blurred colour fields (`#b070f0`, `--brand-b`, `--blush`) at
 * `blur(90px)`, opacity .18–.28, `mix-blend-mode: screen`, drifting on a 30s
 * loop at `z-index:-2` — plus the film-grain tile at .05 above content.
 */
export interface AuroraBackdropProps {
  /** Set false to drop the grain layer. */
  grain?: boolean;
  style?: React.CSSProperties;
}
export declare function AuroraBackdrop(props: AuroraBackdropProps): JSX.Element;
