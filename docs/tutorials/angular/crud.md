# CRUD Operations

## Rename Tasks and Mark as Completed

To make the tasks in the list updatable, we'll bind the `input` elements to the `Task` properties and add a *Save* button to save the changes to the backend database.

1. Add a `saveTask` method to save the state of a task to the backend database 
   *src/app/app.component.ts*
   ```ts
   async saveTask(task: Task) {
      await this.taskRepo.save(task);
   }
   ```
2. Modify the contents of the `tasks` div to include the following `input` elements and a *Save* button to call the `saveTask` method.

   *src/app/app.component.html*
   ```html{5-7}
   <input type="checkbox" [(ngModel)]="hideCompleted" (change)="fetchTasks()" />
   Hide Completed
   <hr />
   <div *ngFor="let task of tasks">
     <input type="checkbox" [(ngModel)]="task.completed">
     <input [(ngModel)]="task.title">
     <button (click)="saveTask(task)">Save</button>
   </div>
   ```

Make some changes and refresh the browser to verify the backend database is updated.
## Add New Tasks

1. Add the `addTask` method to the `AppComponent` class:

   *src/app/app.component.ts*
   ```ts
   addTask() {
   this.tasks.push(new Task());
   }
   ```
1. Add an *Add Task* button in the html:

   *src/app/app.component.html*
   ```html{9}
   <input type="checkbox" [(ngModel)]="hideCompleted" (change)="fetchTasks()" />
   Hide Completed
   <hr />
   <div *ngFor="let task of tasks">
     <input type="checkbox" [(ngModel)]="task.completed">
     <input [(ngModel)]="task.title">
     <button (click)="saveTask(task)">Save</button>
   </div>
   <button (click)="addTask()">Add Task</button>
   ```

Add a few tasks and refresh the browser to verify the backend database is updated.

::: warning Note 
New tasks **will not be saved to the backend** until you press the *Save* button.
:::

::: danger Wait, there's a bug in this code
Notice that if you add a new task by clicking the *Add Task* button, click the *Save* button **multiple times**, and then refresh the browser, **multiple tasks will be added to the list instead of only one**.

This is happening because the Remult `Repository.save` method issues either a `PUT` or a `POST` request, depending on the existence of an `id` value in the `Task` object. 

To fix the bug, modify the `saveTask` method and replace the saved task in the `tasks` array with the object returned from `Repository.save` (which contains the `id` of the task created in the backend).

*src/App.ts*
```ts{2,3}
async saveTask(task: Task) {
  const savedTask = await this.taskRepo.save(task);
  this.tasks = this.tasks.map(t => t === task ? savedTask : t);
}
```
:::

## Delete Tasks

Let's add a *Delete* button next to the *Save* button of each task in the list.

1. Add the `deleteTask` method to the `AppComponent` class:

   *src/app/app.component.ts*
   ```ts
   async deleteTask(task: Task) {
     await this.taskRepo.delete(task);
     this.tasks = this.tasks.filter(t => t !== task);
   }
   ```
1. Add a *Delete* button in the html:

   *src/app/app.component.html*
   ```html{10}
   <input type="checkbox" [(ngModel)]="hideCompleted" (change)="fetchTasks()" />
   Hide Completed
   <hr />
   <div *ngFor="let task of tasks">
     <input type="checkbox" [(ngModel)]="task.completed">
     <input [(ngModel)]="task.title">
     <button (click)="saveTask(task)">Save</button>
     <button (click)="deleteTask(task)">Delete</button>
   </div>
   <button (click)="addTask()">Add Task</button>
   ```
