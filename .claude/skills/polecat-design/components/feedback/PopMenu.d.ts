/** Props for {@link PopMenu} — the anchored action menu (shell.css `.pop-menu`).
 *
 * 190px min width, 8px rows, pops in over .12s. Items may be actions,
 * `{ group: 'View' }` headings, or `'-'` separators.
 */
export interface PopMenuItem {
  label?: string;
  icon?: React.ReactNode;
  /** Right-aligned shortcut or hint. */
  hint?: string;
  group?: string;
  sep?: boolean;
}
export interface PopMenuProps {
  items: Array<PopMenuItem | '-'>;
  onPick?: (item: PopMenuItem) => void;
  style?: React.CSSProperties;
}
export declare function PopMenu(props: PopMenuProps): JSX.Element;
