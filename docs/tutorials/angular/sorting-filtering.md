# Sorting and Filtering
The RESTful API created by Remult supports server-side sorting and filtering. Let's use that to sort and filter the list of tasks.

## Show Active Tasks on Top
Uncompleted tasks are important and should appear above completed tasks in the todo app. 

In the `fetchTasks` method, pass an `options` argument to the `find` method call and set its `orderBy` property to an object that contains the fields you want to sort by.
Use "asc" and "desc" to determine the sort order.

*src/app/app.component.ts*
```ts{3}
async fetchTasks() {
   this.tasks = await this.taskRepo.find({
      orderBy: { completed: "asc" }
   });
}
```

::: warning Note
By default, `false` is a "lower" value than `true`, and that's why uncompleted tasks are now showing at the top of the task list.
:::
## Toggle Display of Completed Tasks
Let's allow the user to toggle the display of completed tasks, using server-side filtering.

1. Add a `hideCompleted` field to the `AppComponent` class and Modify the `fetchTasks` method, and set the `where` property of the options argument of `find`:

*src/app/app.component.ts*
```ts{5}
hideCompleted = false;
async fetchTasks() {
   this.tasks = await this.taskRepo.find({
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

4. Add a `checkbox` input element immediately before the `tasks` div in `app.component.html`, bind its check state to the `hideCompleted` state, and add a `change` handler which calls `fetchTasks` when the value of the checkbox is changed.

*src/app/app.component.html*
```html{1-3}
<input type="checkbox" [(ngModel)]="hideCompleted" (change)="fetchTasks()" />
Hide Completed
<hr />
<div *ngFor="let task of tasks">
  <input type="checkbox" [checked]="task.completed">
  {{task.title}}
</div>
```

After the browser refreshes, a "Hide completed" checkbox appears above the task list. The user can toggle the display of uncompleted tasks using the checkbox.
