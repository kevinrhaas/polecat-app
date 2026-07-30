Inspect-and-edit alongside the main view — a record's detail, notifications, the What's-new feed.

```jsx
<RightPanel title="Q3 Revenue" open={open} onClose={close}>…</RightPanel>
```

Unlike `Modal` it keeps the underlying view legible, so use it whenever the context matters.
