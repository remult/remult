# Entities 

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:
* As a model class for client-side code
* As a model class for server-side code
* By `remult` to generate API endpoints, API queries, and database commands

The `Task` entity class we're creating will have an auto-generated UUID `id` field, a `title` field and a `completed` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

## Define the Model

1. Create a `shared` folder under the `src` folder. This folder will contain code shared between frontend and backend.

2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

*src/shared/Task.ts*
```ts
import { Entity, Fields } from "remult";

@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string()
    title = '';

    @Fields.boolean()
    completed = false;
}
```

3. In the server's `api` module, register the `Task` entity with Remult by adding `entities: [Task]` to an `options` object you pass to the `remultExpress()` middleware:

*src/server/api.ts*
```ts{2,5}
import { remultExpress } from 'remult/remult-express';
import { Task } from '../shared/Task';

export const api = remultExpress({
    entities: [Task]
});
```

The [@Entity](../../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an `options` argument used to define entity-related properties and operations, discussed in the next sections of this tutorial. 

To initially allow all CRUD operations for tasks, we set the option [allowApiCrud](../../docs/ref_entity.md#allowapicrud) to `true`.

The `@Fields.uuid` decorator tells Remult to automatically generate an id using `uuid`. We mark this property as optional so we can create new `Task` objects without assigning an `id` at first, and have Remult generate one before the object's data is stored to the backend database.

The [@Fields.string](../../docs/ref_field.md) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field-related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

## Seed Test Data

Now that the `Task` entity is defined, we can use it to seed the database with some test data.

Add the highlighted code lines to `src/server/api.ts`.

*src/server/api.ts*
```ts{3,7-18}
import { remultExpress } from 'remult/remult-express';
import { Task } from '../shared/Task';
import { remult } from 'remult';

export const api = remultExpress({
    entities: [Task],
    initApi: async () => {
        const taskRepo = remult.repo(Task);
        if (await taskRepo.count() === 0) {
            await taskRepo.insert([
                { title: "Task a" },
                { title: "Task b", completed: true },
                { title: "Task c" },
                { title: "Task d" },
                { title: "Task e", completed: true }
            ]);
        }
    }
});
```

The `initApi` callback is called only once, after a database connection is established and the server is ready to perform initialization operations.

`taskRepo` is a Remult [Repository](../../docs/ref_repository.md) object used to fetch and create `Task` entity objects.

The code in `initApi` simply adds five new Tasks to the database if the current `count` is zero.

Saving the changes will cause the server to restart and seed the database with the test data. Navigate to the `tasks` API route at <http://localhost:3002/api/tasks> to see the data.

::: warning Wait, where is the backend database?
While remult supports [many relational and non-relational databases](https://remult.dev/docs/databases.html), in this tutorial we start by storing entity data in a backend **JSON file**. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::


## Display the Task List
Let's start developing the web app by displaying the list of existing tasks in an Angular component.

1. Create a `Todo` component using Angular's cli
   ```sh
   ng g c todo
   ```

2. Replace the `app.components.html` to use the `todo` component.

3. *src/app/app.component.html*
   ```html
   <app-todo></app-todo>
   ```

4. Add the highlighted code lines to the `TodoComponent` class file:

   *src/app/todo/todo.component.ts*
   ```ts{2-3,11-20}
   import { Component, OnInit } from '@angular/core';
   import { remult } from 'remult';
   import { Task } from '../../shared/Task';
   
   @Component({
     selector: 'app-todo',
     templateUrl: './todo.component.html',
     styleUrls: ['./todo.component.css']
   })
   export class TodoComponent implements OnInit {
     taskRepo = remult.repo(Task);
     tasks: Task[] = [];
   
     ngOnInit() {
       this.fetchTasks();
     }
   
     async fetchTasks() {
       this.tasks = await this.taskRepo.find();
     }
   }
   ```
   
   Here's a quick overview of the different parts of the code snippet:
   * `taskRepo` is a Remult [Repository](../../docs/ref_repository.md) object used to fetch and create Task entity objects.
   * `tasks` is a Task array.
   * The `fetchTasks` method uses the Remult repository's [find](../../docs/ref_repository.md#find) method to fetch tasks from the server.
   * The `ngOnInit` method calls the `fetchTasks` method when the `component` is loaded.

6. Replace the contents of `todo.component.html` with the following HTML:

   *src/app/todo/todo.component.html*
   ```html
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

After the browser refreshes, the list of tasks appears.

### Add Styles

Optionally, make the app look a little better by replacing the contents of `src/styles.css` with [this CSS file](https://raw.githubusercontent.com/remult/angular-express-starter/completed-tutorial/src/styles.css).