# Paging, Sorting and Filtering

The RESTful API created by Remult supports **server-side paging, sorting, and filtering**. Let's use that to limit, sort and filter the list of tasks.

## Limit Number of Fetched Tasks

Since our database may eventually contain a lot of tasks, it make sense to use a **paging strategy** to limit the number of tasks retrieved in a single fetch from the back-end database.

Let's limit the number of fetched tasks to `20`.

To do so, simply pass a `limit` option to the `find` method call:

::: code-group

```svelte [src/routes/+page.svelte]
$effect(() => {
  repo(Task)
    .find(
      { limit: 20 } // [!code ++]
    )
    .then((t) => (tasks = t));
});
```

:::

Depending on the number of tasks that you have added, you may not have enough tasks in the database for this change to have an immediate visible effect, but it will have one later on when we add more tasks.

::: tip
Using `limit` only returns the first page of data. To query subsequent pages, use the [Repository.find()](../../docs/ref_repository.md#find) method's `page` option.
:::

## Sorting By Creation Date

We would like old tasks to appear first in the list, and new tasks to appear last. Let's sort the tasks by their `createdAt` field.

Set the `orderBy` property of the `find` method call's `option` argument to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

::: code-group

```svelte [src/routes/+page.svelte]
$effect(() => {
  repo(Task)
    .find(
      { limit: 20 },
      orderBy: { createdAt: "asc" } // [!code ++]
    )
    .then((t) => (tasks = t));
});
```

:::

## Filtering

Remult supports sending filter rules to the server to query only the tasks that we need.

Adjust your function to fetch only `completed` tasks.

::: code-group

```svelte [src/routes/+page.svelte]
$effect(() => {
  repo(Task)
    .find(
      { limit: 20 },
      orderBy: { createdAt: "asc" },
      where: { completed: true } // [!code ++]
    )
    .then((t) => (tasks = t));
});
```

:::

::: warning NOTE:
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Settings the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

Play with different filtering values, and eventually comment it out, since we do need all the tasks

```svelte [src/routes/+page.svelte] {6}
$effect(() => {
  repo(Task)
    .find(
      { limit: 20 },
      orderBy: { createdAt: "asc" },
      // where: { completed: true }
    )
    .then((t) => (tasks = t));
});
```

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::
