/** Props for {@link Icon} — the fleet's own icon set (polecat-platform/lib/icons.js).
 *
 * 24×24 viewBox, `fill:none`, `stroke:currentColor`, `stroke-width:1.7`, round
 * caps. Single-color and stroke-based is a fleet design bar — never ship a
 * filled or multi-color glyph.
 */
export interface IconProps {
  /** Any name from iconNames() — falls back to `grid` if unknown. */
  name: string;
  /** 15 (small tile) · 18 (psx-tile) · 20 (default) · 22 (rail) · 26 (status). */
  size?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
/** Every glyph, keyed by name — inner SVG strings. Use Object.keys() for pickers. */
export declare const ICON_PATHS: Record<string, string>;
