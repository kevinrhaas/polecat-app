Mount this at the top of any app's landing page instead of writing bespoke header markup.

```jsx
<SiteHeader app="analytics" glyph="chart" name="Analytics"
  accent="#d4773b"
  nav={[{label:'Features',href:'#features'},{label:'How it works',href:'#how'}]}
  cta={{ label: 'Launch app', href: '/app/' }} />
```

The app owns its section links; the chrome owns the mark, the CTA treatment and the suite link.
