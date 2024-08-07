---
type: lesson
title: Paging
focus: /frontend/Todo.tsx
---

# Paging

The RESTful API created by Remult supports server-side paging, sorting, and filtering. Let's use these features to limit, sort, and filter the list of tasks.

```ts add={4,5}
useEffect(() => {
  taskRepo
    .find({
      limit: 2,
      page: 2,
    })
    .then(setTasks)
}, [])
```

### Code Explanation

- We update the `useEffect` hook to use the `find` method with paging options.
- The `limit` option specifies the number of tasks to retrieve.
- The `page` option specifies which page of results to retrieve.

This code results in the following REST API request:
`/api/tasks?_limit=2&_page=2`

Try playing with different values for `limit` and `page` to see the results in the preview window.
