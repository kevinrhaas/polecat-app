/** Props for {@link GlyphTile} — the shared mark chassis, matched to the
 * Polecat logo: a ROUND, single-colour badge.
 *
 * The logo is a monoline creature inside a heavy ring, so every app mark is
 * built the same way — a ring, a stroke glyph, one colour. **No gradients in
 * the mark system.** The chassis is the constant that makes the fleet cohere;
 * only the glyph and the accent change.
 */
export interface GlyphTileProps {
  /** Fleet app id — pulls the canonical accent from lib/catalog.js. */
  app?: 'chat' | 'jobtracker' | 'analytics' | 'autoselector' | 'relay' | 'games' | 'manager' | 'modelserver';
  /** Icon name; use the app's catalog glyph. */
  glyph: string;
  /** Override the accent when the app isn't in the catalog. */
  accent?: string;
  /** 24 · 30 (header) · 38 (rail, waffle) · 44 (launcher). */
  size?: number;
  /** ring = the logo's construction (default). solid = accent disc, white glyph. */
  variant?: 'ring' | 'solid';
  style?: React.CSSProperties;
}
export declare function GlyphTile(props: GlyphTileProps): JSX.Element;
/** [accent, accent2] per app. Only the first is rendered — the mark is single-colour. */
export declare const FLEET_ACCENTS: Record<string, [string, string]>;
