# Paging, Sorting and Filtering

The RESTful API created by Remult supports **server-side paging, sorting, and filtering**. Let's use that to limit, sort and filter the list of tasks.

## Limit Number of Fetched Tasks

Since our database may eventually contain a lot of tasks, it make sense to use a **paging strategy** to limit the number of tasks retrieved in a single fetch from the back-end database.

Let's limit the number of fetched tasks to `20`.

In the `onMount` hook defined in the `Todo` component, pass an `options` argument to the `find` method call and set its `limit` property to 20.

```ts{11}
// src/components/Todo.tsx

//...

export default function Todo() {
  //...

  onMount(() =>
    taskRepo
      .find({
        limit: 20,
      })
      .then(setTasks)
  )

  //...
}
```

There aren't enough tasks in the database for this change to have an immediate effect, but it will have one later on when we'll add more tasks.

::: tip
To query subsequent pages, use the [Repository.find()](../../docs/ref_repository.md#find) method's `page` option.
:::

## Sorting By Creation Date

We would like old tasks to appear first in the list, and new tasks to appear last. Let's sort the tasks by their `createdAt` field.

In the `onMount` hook, set the `orderBy` property of the `find` method call's `option` argument to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

```ts{7}
// src/components/Todo.tsx

onMount(() =>
  taskRepo
    .find({
      limit: 20,
      orderBy: { createdAt: "asc" }
    })
    .then(setTasks)
)
```

## Server Side Filtering

Remult supports sending filter rules to the server to query only the tasks that we need.

Adjust the `onMount` hook to fetch only `completed` tasks.

```ts{8}
// src/components/Todo.tsx

onMount(() =>
  taskRepo
    .find({
      limit: 20,
      orderBy: { createdAt: "asc" },
      where: { completed: true }
    })
    .then(setTasks)
)
```

::: warning Note
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Setting the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

Play with different filtering values, and eventually comment it out, since we do need all the tasks

```ts{6}
  onMount(() =>
    taskRepo
      .find({
        limit: 20,
        orderBy: { createdAt: "asc" },
        //where: { completed: true },
      })
      .then(setTasks);
  );
```

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::
