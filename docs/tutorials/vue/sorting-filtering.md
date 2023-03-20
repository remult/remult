# Paging, Sorting and Filtering

The RESTful API created by Remult supports **server-side paging, sorting, and filtering**. Let's use that to limit, sort and filter the list of tasks.

## Limit Number of Fetched Tasks

Since our database may eventually contain a lot of tasks, it make sense to use a **paging strategy** to limit the number of tasks retrieved in a single fetch from the back-end database.

Let's limit the number of fetched tasks to `20`.

In the `onMounted` hook, pass an `options` argument to the `find` method call and set its `limit` property to 20.

```ts{6}
// src/App.vue

onMounted(() =>
  taskRepo
    .find({
      limit: 20
    })
    .then(items => (tasks.value = items))
)
```

There aren't enough tasks in the database for this change to have an immediate effect, but it will have one later on when we'll add more tasks.

::: tip
To query subsequent pages, use the [Repository.find()](../../docs/ref_repository.md#find) method's `page` option.
:::

## Show Active Tasks on Top

Uncompleted tasks are important and should appear above completed tasks in the todo app.

In the `onMounted` hook, set the `orderBy` property of the `find` method call's `option` argument to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

```ts{7}
// src/App.vue

onMounted(() =>
  taskRepo
    .find({
      limit: 20,
      orderBy: { completed: "asc" }
    })
    .then(items => (tasks.value = items))
)
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::

## Server side Filtering

Remult supports sending filter rules to the server to query only the tasks that we need.

Adjust the `onMounted` hook to fetch only `completed` tasks.

```ts{8}
// src/App.vue

onMounted(() =>
  taskRepo
    .find({
      limit: 20,
      orderBy: { completed: "asc" },
      where: { completed: true }
    })
    .then(items => (tasks.value = items))
)
```

::: warning Note
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Settings the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

Play with different filtering values, and eventually comment it out, since we do need all the tasks

```ts{6}
onMounted(() =>
  taskRepo
    .find({
      limit: 20,
      orderBy: { completed: "asc" }
      //where: { completed: true }
    })
    .then(items => (tasks.value = items))
)
```

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::
