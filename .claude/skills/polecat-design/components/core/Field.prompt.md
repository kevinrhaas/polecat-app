Every form control gets a Field; FieldRow puts two side by side (each keeps a 160px min and stacks on phones).

```jsx
<FieldRow>
  <Field label="Name"><Input placeholder="Your name" /></Field>
  <Field label="Email"><Input type="email" placeholder="you@example.com" /></Field>
</FieldRow>
```
