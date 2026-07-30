Interactive filters and saved-view chips above a list — the app's filter row is a row of these.

```jsx
<Pill on>All</Pill>
<Pill count={12} icon={<Icon name="flag" size={14} />}>Overdue</Pill>
<Pill disabled>Archived</Pill>
```

Pill = interactive (a `<button>`, `aria-pressed`). For a static label use `Chip`.
