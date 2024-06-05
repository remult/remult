# Shadcn React Table

[Live Demo](https://table.up.railway.app/)
[Open in stackblitz](https://stackblitz.com/github/remult/remult/tree/main/examples/shadcn-react-table)

This examples demos:

- Typed Server side sorting, filtering & paging from the frontend
- Full CRUD capabilities
- Single source of truth for:
  - typing
  - Database structure
  - rest api
  - frontend & api validation
  - Frontend query language
  - UI metadata (grid columns, and form fields)
- live query
- Using remult with react-hook-forms
- remult admin (`/api/admin`)

## Checkout source

```sh
npx degit https://github.com/remult/remult/examples/shadcn-react-table shadcn-react-table
```

## Inspired by

- https://ui.shadcn.com/examples/tasks
- https://table.sadmn.com/

To run this example:

- `npm install` or `yarn`
- `npm run start` or `yarn start`

# Awaitable Dialog

## Setup:

Add the [Dialog Provider to root](src/components/dialog/dialog-context.tsx)

```ts
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
        <App />
    </DialogProvider>
  </React.StrictMode>,
)

```

## Use Question

```ts
const question = useQuestion()
async function doSomething() {
  if (await question('Are you Sure?')) {
    // Do Something
  }
}
```

## Custom Modal

```ts
const dialog = useDialog()

async function doSomething() {
  if (
    await dialog(
      (resolve) => (
        <div>
          <h2>Are you sure?</h2>
          <button onClick={() => resolve(true)}>Yes</button>
        </div>
      ),
      false, // default result
    )
  ) {
    // Do Something
  }
}
```

## Reusable Hook

```tsx
export default function useQuestion() {
  const dialog = useDialog()
  return (question: string) =>
    dialog(
      (resolve) => (
        <div>
          <h2>Are you sure?</h2>
          <button onClick={() => resolve(true)}>Yes</button>
        </div>
      ),
      false, // default result
    )
}
```

## Form Dialog

```tsx
const form = useFormDialog()

async function login() {
  await form({
    fields: {
      username: {},
      password: { type: 'password' },
    },
    onOk: async ({ username, password }) => {
      // perform login
    },
  })
}
```
