The app's persistent header. It carries app-level actions only — dashboard-scoped controls live above the thing they act on.

```jsx
<Topbar section="Dashboards" onSearch={openPalette} actions={<>
  <IconButton icon={<Icon name="sparkle" />} label="What's new" />
  <IconButton icon={<Icon name="waffle" />} label="Polecat suite" />
  <Button surface="app" variant="primary" size="sm">New ▾</Button>
  <IconButton icon={<Icon name="more" />} label="More actions" />
</>} />
```

The right-side cluster order is fixed across the fleet: What's-new · What's-next · theme · waffle · +New · ⋯More.
