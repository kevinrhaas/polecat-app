/** Props for {@link EmptyState} — the centred "nothing here yet" panel
 * (`.sec-empty`, `#canvasEmpty`). Copy says what to do next, plainly.
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
