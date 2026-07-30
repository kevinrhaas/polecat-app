Empty lists and blank canvases. Teach the next action; never apologise.

```jsx
<EmptyState icon={<Icon name="grid" size={26} />} title="Canvas is empty"
  description="Drag a dataset or sample query from the Data panel onto the canvas, or drop a CSV/JSON file here to build a dashboard instantly."
  actions={<><Button surface="app" size="sm">Open data panel</Button>
             <Button surface="app" variant="ghost" size="sm">Import a file</Button></>} />
```
