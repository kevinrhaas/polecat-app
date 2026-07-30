/** Props for {@link Input}, {@link Textarea} and {@link Select} — shell.css `.input`.
 *
 * Focus grows a 3px brand ring (`--ring`); the border colour changes but never
 * its width, so nothing shifts. `Select` ships the shell's own chevron so no OS
 * arrow appears.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  style?: React.CSSProperties;
}
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
}
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<string | { value: string; label: string }>;
}
export declare function Input(props: InputProps): JSX.Element;
export declare function Textarea(props: TextareaProps): JSX.Element;
export declare function Select(props: SelectProps): JSX.Element;
