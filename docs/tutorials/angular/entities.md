# Entities

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:

- As a model class for client-side code
- As a model class for server-side code
- By `remult` to generate API endpoints, API queries, and database commands

The `Task` entity class we're creating will have an auto-generated `id` field, a `title` field, a `completed` field and an auto-generated `createdAt` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations.

## Define the Model

1. Create a `shared` folder under the `src` folder. This folder will contain code shared between frontend and backend.

2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

```ts
// src/shared/Task.ts

import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id = ''

  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
```

3. In the server's `api` module, register the `Task` entity with Remult by adding `entities: [Task]` to an `options` object you pass to the `remultExpress()` middleware:

```ts{4,7}
// src/server/api.ts

import { remultExpress } from "remult/remult-express"
import { Task } from "../shared/Task"

export const api = remultExpress({
  entities: [Task]
})
```

The [@Entity](../../docs/ref_entity.md) decorator tells Remult this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as a default database collection/table name), and an `options` argument used to define entity-related properties and operations, discussed in the next sections of this tutorial.

To initially allow all CRUD operations for tasks, we set the option [allowApiCrud](../../docs/ref_entity.md#allowapicrud) to `true`.

The [@Fields.cuid](../../docs/field-types.md#fields-cuid) decorator tells Remult to automatically generate a short random id using the [cuid](https://github.com/paralleldrive/cuid) library. This value can't be changed after the entity is created.

The [@Fields.string](../../docs/field-types.md#fields-string) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field-related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

The [@Fields.createdAt](../../docs/field-types.md#fields-createdat) decorator tells Remult to automatically generate a `createdAt` field with the current date and time.

::: tip
For a complete list of supported field types, see the [Field Types](../../docs/field-types.md) section in the Remult documentation.
:::

## Test the API

Now that the `Task` entity is defined, we can start using the REST API to query and add a tasks.

1. Open a browser with the url: [http://localhost:3002/api/tasks](http://localhost:3002/api/tasks), and you'll see that you get an empty array.

2. Use `curl` to `POST` a new task - _Clean car_.

```sh
curl http://localhost:3002/api/tasks -d "{\"title\": \"Clean car\"}" -H "Content-Type: application/json"
```

3. Refresh the browser for the url: [http://localhost:3002/api/tasks](http://localhost:3002/api/tasks) and see that the array now contains one item.

4. Use `curl` to `POST` a few more tasks:

```sh
curl http://localhost:3002/api/tasks -d "[{\"title\": \"Read a book\"},{\"title\": \"Take a nap\", \"completed\":true },{\"title\": \"Pay bills\"},{\"title\": \"Do laundry\"}]" -H "Content-Type: application/json"
```

- Note that the `POST` endpoint can accept a single `Task` or an array of `Task`s.

5. Refresh the browser again, to see that the tasks were stored in the db.

::: warning Wait, where is the backend database?
While remult supports [many relational and non-relational databases](https://remult.dev/docs/databases.html), in this tutorial we start by storing entity data in a backend **JSON file**. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::

## Admin UI

### Enabling the Admin UI

Add the Admin UI to your Angular application by setting the `admin` option to `true` in the `remultExpress()` configuration in your `src/server/api.ts` file:

```ts
// src/server/api.ts

import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task.js'

export const api = remultExpress({
  entities: [Task],
  admin: true, // Enable the Admin UI
})
```

### Accessing and Using the Admin UI

Navigate to `http://localhost:3002/api/admin` to access the Admin UI. Here, you can perform CRUD operations on your entities, view their relationships via the Diagram entry, and ensure secure management with the same validations and authorizations as your application.

![Remult Admin](/remult-admin.png)

### Features

- **CRUD Operations**: Directly create, update, and delete tasks through the Admin UI.
- **Entity Diagram**: Visualize relationships between entities for better data structure understanding.
- **Security**: Operations are secure, adhering to application-defined rules.

## Display the Task List

Let's start developing the web app by displaying the list of existing tasks in an Angular component.

1. Create a `Todo` component using Angular's cli

   ```sh
   ng g c todo
   ```

2. Import the new component in the `app.component.ts`

   ```ts{8,18}
   //src/app/app.component.ts

   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { RouterOutlet } from '@angular/router';
   import { HttpClientModule } from '@angular/common/http';
   import { FormsModule } from '@angular/forms';
   import { TodoComponent } from './todo/todo.component';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [
       CommonModule,
       RouterOutlet,
       HttpClientModule,
       FormsModule,
       TodoComponent,
     ],
     templateUrl: './app.component.html',
     styleUrl: './app.component.css',
   })
   export class AppComponent {
     title = 'remult-angular-todo';
   }

   ```

3. Replace the `app.components.html` to use the `todo` component.

   ```html
   <!-- src/app/app.component.html -->

   <app-todo></app-todo>
   ```

4. Add the highlighted code lines to the `TodoComponent` class file:

   ```ts{5-7,12,,17-21}
   // src/app/todo/todo.component.ts

   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { FormsModule } from '@angular/forms';
   import { remult } from 'remult';
   import { Task } from '../../shared/Task';

   @Component({
     selector: 'app-todo',
     standalone: true,
     imports: [CommonModule, FormsModule],
     templateUrl: './todo.component.html',
     styleUrl: './todo.component.css',
   })
   export class TodoComponent {
     taskRepo = remult.repo(Task);
     tasks: Task[] = [];
     ngOnInit() {
       this.taskRepo.find().then((items) => (this.tasks = items));
     }
   }
   ```

   Here's a quick overview of the different parts of the code snippet:

   - We've imported the `FormsModule` for angular's forms support
   - `taskRepo` is a Remult [Repository](../../docs/ref_repository.md) object used to fetch and create Task entity objects.
   - `tasks` is a Task array.
   - The `ngOnInit` method calls theRemult [repository](../../docs/ref_repository.md)'s [find](../../docs/ref_repository.md#find) method to fetch tasks from the server, once when the component is loaded.

5. Replace the contents of `todo.component.html` with the following HTML:

   ```html
   <!-- src/app/todo/todo.component.html -->

   <h1>todos</h1>
   <main>
     <div *ngFor="let task of tasks">
       <input type="checkbox" [(ngModel)]="task.completed" />
       {{task.title}}
     </div>
   </main>
   ```

After the browser refreshes, the list of tasks appears.
