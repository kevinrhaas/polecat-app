/** Props for {@link Field} and {@link FieldRow} — the label/control/hint stack (shell.css `.field`). */
export interface FieldProps {
  /** 12px / 600 / --text-2. */
  label?: React.ReactNode;
  /** 11.5px / --text-3, below the control. */
  hint?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Field(props: FieldProps): JSX.Element;
export declare function FieldRow(props: { children?: React.ReactNode; style?: React.CSSProperties }): JSX.Element;
