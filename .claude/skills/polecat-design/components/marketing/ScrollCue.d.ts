/** Props for {@link ScrollCue} — the tiny uppercase affordance under the hero
 * (site.css `.scroll-cue`). 11px/800/+2.5px in --text-3; the arrow bobs on 1.6s.
 */
export interface ScrollCueProps {
  href?: string;
  label?: string;
  style?: React.CSSProperties;
}
export declare function ScrollCue(props: ScrollCueProps): JSX.Element;
