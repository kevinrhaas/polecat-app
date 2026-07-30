The "jump to another Polecat app" menu, anchored under the topbar's waffle button.

```jsx
<Waffle current="analytics" onPick={a => location.assign('https://' + a.id + '.polecat.live')} />
```

Defaults to the full eight-app `FLEET`. Every app opens in a new tab from marketing surfaces.
