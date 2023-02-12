# Live Query

Our todo list has more than one user, viewing it at a time - try opening multiple tabs with the todo list, update the tasks in one tab and you'll see the other tabs don't reflect these changes unless you reload them.

To fix that, we'll use the `liveQuery` feature of remult.

Adjust the `useEffect` hook in the `page.tsx` file
```ts
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

Try changing values in one tab and review these changes on the other tab.
