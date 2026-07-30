Two-to-four mutually exclusive modes — the fleet's canonical use is `simple / standard / expert`.

```jsx
<Segmented options={['simple','standard','expert']} value={mode} onChange={setMode} />
```

Hairline dividers between segments; the active one takes the brand→accent gradient. Don't use it for navigation — that's the rail's job.
