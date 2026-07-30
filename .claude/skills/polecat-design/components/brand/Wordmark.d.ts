/** Props for {@link Wordmark} — "Pole" in --text, "cat" in the house gradient, 800 weight.
 *
 * `variant="suite"` is the muted `Polecat ↗` back-to-the-suite link that sits at
 * the right edge of every app front door's header — same place, same treatment.
 */
export interface WordmarkProps {
  /** 17 nav · 22 root footer. Tracking tightens to -.6px above 19. */
  size?: number;
  /** Optional path to the mark (assets/logo-mark-white.png on dark). */
  mark?: string;
  variant?: 'default' | 'suite';
  href?: string;
  style?: React.CSSProperties;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
