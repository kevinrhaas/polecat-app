/** Props for {@link SiteFooter} — two lines, one wording, every app
 * (site-chrome.css `.psx-footer`).
 *
 * Line 1: `AppName · part of the polecat.live suite` — "suite", never "family".
 * Line 2: `Docs · App · Third-party notices · © YEAR Polecat.live`.
 * `variant="root"` is polecat.live's own: the sharp wordmark on top, a suite
 * links row, no "part of the suite" line, and no What's-new link.
 */
export interface SiteFooterProps {
  app?: string;
  glyph?: string;
  name?: string;
  /** Single accent — the mark is round and one colour; accent2 is not used. */
  accent?: string;
  links?: Array<{ label: string; href: string }>;
  suiteLinks?: Array<{ label: string; href: string }>;
  year?: number;
  variant?: 'app' | 'root';
  style?: React.CSSProperties;
}
export declare function SiteFooter(props: SiteFooterProps): JSX.Element;
