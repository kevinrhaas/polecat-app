Verb-first primary action; use it for the one thing you want the reader to do on a section.

```jsx
<Button variant="primary" size="lg" href="#apps">See what we've shipped</Button>
<Button variant="ghost" size="lg" href="#work">Work with me →</Button>
<Button surface="app" variant="primary" size="sm">Save</Button>
```

- `surface="site"` (default) is a **pill** with the house gradient and `translateY(-2px)` on hover; `surface="app"` is the denser shell button (9px radius, surface-2, gradient only on primary).
- Never two primaries side by side — the pattern is one primary + one ghost.
- Labels are sentence case and verb-first: `Send it`, `Launch app`, `+ New dataset`. An ellipsis (`Save as…`) means "opens more input".
