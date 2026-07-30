Confirmations and recoverable errors. Never for anything the user must act on.

```jsx
<ToastStack>
  <Toast tone="ok" title="Dashboard saved" body="Q3 Revenue · 2 views" action="Undo" />
</ToastStack>
```

Titles are 13.5px/700 and state the outcome, not the mechanism. Offer `Undo` rather than a confirm dialog wherever you can.
