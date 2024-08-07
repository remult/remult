---
type: lesson
title: Sorting
focus: /frontend/Todo.tsx
---

# Sorting

Remult's RESTful API also supports server-side sorting. Let's sort the list of tasks by their title.

```ts add={4-6}
useEffect(() => {
  taskRepo
    .find({
      orderBy: {
        title: 'asc',
      },
    })
    .then(setTasks)
}, [])
```

### Code Explanation

- We update the `useEffect` hook to use the `find` method with sorting options.
- The `orderBy` option specifies the field to sort by and the sort direction (`asc` for ascending, `desc` for descending).
- The sorting is performed on the server, which means the server sorts the data before sending it back to the client.

This code results in the following REST API request:
`/api/tasks?_sort=createdAt&_order=asc`

Try changing the sort direction and sorting by different fields to see the results in the preview window.
