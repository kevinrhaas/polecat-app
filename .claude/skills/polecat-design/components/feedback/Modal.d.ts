/** Props for {@link Modal} — centred dialog on a blurred scrim (shell.css `.modal`).
 *
 * 20px radius, 560px default; `wide` 920, `full` 1100×90vh. Below 520px every
 * size becomes a fixed full-screen sheet with a sticky footer.
 */
export interface ModalProps {
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  size?: 'md' | 'wide' | 'full';
  footer?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Modal(props: ModalProps): JSX.Element;
