# Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

## Show Active Tasks on Top
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `fetchTasks` function, pass an `options` argument to the `find` method call and set its `orderBy` property to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

*src/App.vue*
```ts{3}
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" }
  });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
## Toggle Display of Completed Tasks
Let's allow the user to toggle the display of completed tasks, using server-side filtering.

1. Add a `hideCompleted` `ref` field and Modify the `fetchTasks` function, and set the `where` property of the options argument of `find`:

*src/App.vue*
```ts{1,5}
const hideCompleted = ref(false);
async function fetchTasks() {
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
```

::: warning Note
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Settings the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::


4. Add a `checkbox` input element immediately before the `tasks` map in `App.vue`, bind its check state to the `hideCompleted` state, and add a `change` handler which calls `fetchTasks` when the value of the checkbox is changed.

*src/App.vue*
```vue{2-5}
<template>
  <input type="checkbox" 
    v-model="hideCompleted" 
    @change="fetchTasks()" /> Hide Completed {{ hideCompleted }}
  <hr />
  <div v-for="task in tasks">
    <input type="checkbox" v-model="task.completed" />
    {{ task.title }}
  </div>
</template>
```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
