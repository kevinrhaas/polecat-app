Focused tasks that need the rest of the UI to wait — a form, a comparison, a destructive confirm.

```jsx
<Modal title="New connection" titleIcon={<Icon name="link" />} onClose={close}
  footer={<><Button surface="app" variant="ghost">Cancel</Button>
           <Button surface="app" variant="primary">Create</Button></>}>
  …
</Modal>
```

Footer actions are right-aligned, cancel first. For a browsing or inspecting flow prefer `Sheet` or `RightPanel`.
