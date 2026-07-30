A single navigable section inside `Rail`.

```jsx
<RailItem icon={<Icon name="layers" />} label="Dashboards" badge={4} open />
<RailItem icon={<Icon name="gear" />} label="Settings" open />
```

Exactly one item is `active` at a time, and it also sets `aria-current="page"`. Min height 44px below the drawer breakpoint.
