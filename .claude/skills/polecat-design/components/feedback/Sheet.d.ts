/** Props for {@link Sheet} — a side-anchored modal (shell.css `.modal.sheet`).
 *
 * Square corners, full height, 440px from the right; `side="bottom"` gets a
 * 20px top radius and an 88vh cap (the phone pattern).
 */
export interface SheetProps {
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
  footer?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Sheet(props: SheetProps): JSX.Element;
