/** Props for {@link SiteHeader} — the shared marketing chrome every app front door mounts
 * (site-chrome.css `.psx-header`).
 *
 * Left: the app's glyph tile + name, linking to its own home. Centre/right: the
 * app's own sections (they hide below 640px). Then the accent CTA, then the
 * muted `Polecat ↗` suite link — same place, same treatment, every app.
 */
export interface SiteHeaderProps {
  app?: string;
  glyph: string;
  name: string;
  /** Single accent — the mark is round and one colour; accent2 is not used. */
  accent?: string;
  nav?: Array<{ label: string; href: string }>;
  /** The accent-filled pill: Launch app / Open console. Opens in a new tab. */
  cta?: { label: string; href: string };
  suiteLink?: boolean;
  style?: React.CSSProperties;
}
export declare function SiteHeader(props: SiteHeaderProps): JSX.Element;
