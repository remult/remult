# Live Queries :rocket:

::: tip New Feature
Live queries are a new feature introduced in version 0.18.
:::

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh the browser.

Let's add realtime multiplayer capabilities to this app.

## Realtime updated todo list

Let's switch from fetching Tasks once when the React component is loaded, and manually maintaining state for CRUD operations, to using a realtime updated live query subscription **for both initial data fetching and subsequent state changes**.

Adjust the `useEffect` hook in the `pages/index.tsx` file

_src/pages/index.tsx_

```ts{2-3,8}
useEffect(() => {
  return taskRepo
    .liveQuery({
      limit: 20,
      orderBy: { completed: "asc" }
      //where: { completed: true },
    })
    .subscribe(info => setTasks(info.applyChanges))
}, [])
```

Let's review the change:

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method and it's `subscribe` method.
- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up to date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we send that method to the `setTasks` state function, to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received
- The `subscribe` method return an `unsubscribe` method, we return it to the `useEffect` hook so that it'll call the `unsubscribe` as the component unmounts

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.

For scalable production / serverless environments, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/), and live-query information can be stored to any database supported by Remult.
:::