---
type: lesson
title: Filtering
focus: /frontend/Todo.tsx
---

# Filtering

Remult's RESTful API also supports server-side filtering. Let's filter the list of tasks to show only the completed ones.

```ts add={4-6}
useEffect(() => {
  taskRepo
    .find({
      where: {
        completed: true,
      },
    })
    .then(setTasks)
}, [])
```

### Code Explanation

- We update the `useEffect` hook to use the `find` method with filtering options.
- The `where` option specifies the condition to filter by. In this case, we're filtering tasks to show only those that are completed (`completed: true`).
- The filtering is performed on the server, which means the server filters the data before sending it back to the client.

This code results in the following REST API request:
`/api/tasks?completed=true`

You can experiment with other types of conditions like `$contains`, `$startsWith`, `$and`, `$not`, and `$or`. All these are detailed in the [Remult documentation](https://remult.dev/docs/entityFilter).

Try changing the filter condition to see the results in the preview window.
