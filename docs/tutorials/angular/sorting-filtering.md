# Paging, Sorting and Filtering
The RESTful API created by Remult supports **server-side paging, sorting, and filtering**. Let's use that to limit, sort and filter the list of tasks.

## Limit Number of Fetched Tasks
Since our database may eventually contain a lot of tasks, it make sense to use a **paging strategy** to limit the number of tasks retrieved in a single fetch from the back-end database.

Let's limit the number of fetched tasks to `20`.

In the `fetchTasks` function, pass an `options` argument to the `find` method call and set its `limit` property to 20.

*src/app/todo/todo.component.ts*
```ts{3}
async fetchTasks() {
   this.tasks = await this.taskRepo.find({
      limit: 20
   });
}
```

There aren't enough tasks in the database for this change to have an immediate effect, but it will have one later on when we'll add more tasks.

::: tip
To query subsequent pages, use the [Repository.find()](../../docs/ref_repository.md#find) method's `page` option.
:::

## Show Active Tasks on Top
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `fetchTasks` function, set the `orderBy` property of the `find` method call's `option` argument to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

*src/app/todo/todo.component.ts*
```ts{4}
async fetchTasks() {
   this.tasks = await this.taskRepo.find({
      limit: 20,
      orderBy: { completed: "asc" }
   });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
## Toggle Display of Completed Tasks
Let's allow the user to toggle the display of completed tasks, using server-side filtering.

1. Add a `hideCompleted` field to the `TodoComponent` class and Modify the `fetchTasks` method, and set the `where` property of the options argument of `find`:

*src/app/todo/todo.component.ts*
```ts{1,6}
hideCompleted = false;
async fetchTasks() {
   this.tasks = await this.taskRepo.find({
      limit: 20,
      orderBy: { completed: "asc" },
      where: { completed: this.hideCompleted ? false : undefined }
   });
}
```

::: warning Note
Because the `completed` field is of type `boolean`, the argument is **compile-time checked to be of the `boolean` type**. Settings the `completed` filter to `undefined` causes it to be ignored by Remult.
:::

::: tip Learn more
Explore the reference for a [comprehensive list of filtering options](../../docs/entityFilter.md).
:::

4. Add a `checkbox` input element immediately before the `tasks` div in `todo.component.html`, bind its check state to the `hideCompleted` state, and add a `change` handler which calls `fetchTasks` when the value of the checkbox is changed.

*src/app/todo/todo.component.html*
```html{1-6}
<input
    type="checkbox"
    [(ngModel)]="hideCompleted"
    (change)="fetchTasks()"
>
Hide Completed
<main>
    <div *ngFor="let task of tasks">
        <input
            type="checkbox"
            [checked]="task.completed"
        >
        {{task.title}}
    </div>
</main>
```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
