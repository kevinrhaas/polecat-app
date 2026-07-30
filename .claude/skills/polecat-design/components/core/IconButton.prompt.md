Topbar and panel-header actions where a label would crowd the row.

```jsx
<IconButton icon={<Icon name="bell" />} label="Notifications" />
<IconButton icon={<Icon name="moon" />} label="Toggle dark mode" active />
<IconButton icon={<Icon name="more" />} label="More actions" variant="ghost" />
```

Always pass `label` — the shipped code sets both `title` and `aria-label` on every one of these. Use `size="lg"` below the 860px breakpoint so the target clears 44px.
