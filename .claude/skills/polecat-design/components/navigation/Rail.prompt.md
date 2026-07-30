The app frame's left navigation — brand tile, grouped sections, and a collapse toggle.

```jsx
<Rail app="analytics" glyph="chart" name="Analytics" open={open} onToggle={() => setOpen(!open)}>
  <RailGroup open={open}>Workspace</RailGroup>
  <RailItem icon={<Icon name="home" />} label="Home" active open={open} />
  <RailItem icon={<Icon name="chart" />} label="Explore" open={open} />
</Rail>
```

Group labels are the real fleet vocabulary: `Workspace`, `Build`, `Manage`. Settings, Help and the backend-status row sit at the bottom, after a spacer.
