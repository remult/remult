# Live Queries :rocket:

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh the browser.

Let's add realtime multiplayer capabilities to this app.

## Realtime updated todo list

Let's switch from fetching Tasks once when the solid component is loaded, and manually maintaining state for CRUD operations, to using a realtime updated live query subscription **for both initial data fetching and subsequent state changes**.

1. Modify the contents of the `onMount` hook in the `src/components/Todo.tsx` file

```ts{4,6,11}
// src/components/Todo.tsx

onMount(() =>
  onCleanup(
    taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { createdAt: "asc" },
        //where: { completed: true },
      })
      .subscribe((info) => setTasks(info.applyChanges))
  )
)
```

Let's review the change:

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method to define the query, and then call its `subscribe` method to establish a subscription which will update the Tasks state in realtime.
- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up to date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we send that method to the `setTasks` state function, to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received
- The `subscribe` method returns an `unsubscribe` function which we send to the `onCleanup` function, so that it'll be called when the component unmounts.

::: warning Import onCleanup
This code requires adding an import of `onCleanup` from `solid-js`.
:::

2. As all relevant CRUD operations (made by all users) will **immediately update the component's state**, we should remove the manual adding of new Tasks to the component's state:

```ts{7}
// src/components/Todo.tsx

async function addTask(e: Event) {
  e.preventDefault()
  try {
    await taskRepo.insert({ title: newTaskTitle() })
    // ^ this no longer needs to be a variable as we are not using it to set the state.
    // setTasks([...tasks, newTask]) <-- this line is no longer needed
    setNewTaskTitle("")
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
```

3. Optionally remove other redundant state changing code:

```tsx{7-9,21}
// src/components/Todo.tsx

//...
<For each={tasks}>
  {(task, i) => {
    async function setCompleted(completed: boolean) {
      //const updatedTask = await taskRepo.update(task, { completed }) <- Delete this line
      //setTasks(i(), updatedTask) <- Delete this line
      await taskRepo.update(task, { completed }) // <- replace with this line
    }
    async function saveTask() {
      try {
        await taskRepo.save(task)
      } catch (error) {
        alert((error as { message: string }).message)
      }
    }
    async function deleteTask() {
      try {
        await taskRepo.delete(task)
        // setTasks(tasks.filter((t) => t !== task)) <- Delete this line
      } catch (error) {
        alert((error as { message: string }).message)
      }
    }
```

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.
Check the browser's network tab, you'll see a call to the `/api/stream` route which receives messages on every update.

For serverless environments _(or multi servers)_, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/) (or others), and live-query information can be stored to any database supported by Remult.
:::
