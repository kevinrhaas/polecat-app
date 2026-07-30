/** Props for {@link Toast} and {@link ToastStack} — shell.css `.toast`.
 *
 * Bottom-right, 4px semantic left border, overshoots in over .26s
 * `cubic-bezier(.2,.9,.3,1.2)`. Click anywhere to dismiss.
 */
export interface ToastProps {
  tone?: 'brand' | 'ok' | 'err' | 'info';
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Inline undo-style action link under the body. */
  action?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
export declare function ToastStack(props: { children?: React.ReactNode; style?: React.CSSProperties }): JSX.Element;
