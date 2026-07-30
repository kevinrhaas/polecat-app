Text, long text and choice inputs. Wrap each in `Field` for its label and hint.

```jsx
<Field label="Email" hint="Never shared.">
  <Input type="email" placeholder="you@example.com" />
</Field>
<Field label="I'm interested in">
  <Select options={['Model Server access','A specific app','Consulting','Just saying hi']} />
</Field>
<Field label="Message"><Textarea rows={4} placeholder="A sentence or two about what you're after…" /></Field>
```

Placeholders are examples, not instructions, and sit in `--text-3` at weight 400.
