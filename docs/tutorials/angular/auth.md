# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use `Express`'s [cookie-session](https://expressjs.com/en/resources/middleware/cookie-session.html) middleware to store an authenticated user's session within a cookie. The `user` property of the session will be set by the API server upon a successful simplistic sign-in (based on username without password).

## Tasks CRUD Requires Sign-in

This rule is implemented within the `Task` `@Entity` decorator, by modifying the value of the `allowApiCrud` property.
This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

```ts{4}
// src/shared/Task.ts

@Entity("tasks", {
    allowApiCrud: Allow.authenticated
})
```

::: warning Import Allow
This code requires adding an import of `Allow` from `remult`.
:::

After the browser refreshes, **the list of tasks disappeared** and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL

```sh
curl -i http://localhost:3002/api/tasks
```

:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAllCompleted` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAllCompleted` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAllCompleted` method of `TasksController`.

```ts
// src/shared/TasksController.ts

@BackendMethod({ allowed: Allow.authenticated })
```

**This code requires adding an import of `Allow` from `remult`.**
:::

## User Authentication

Let's add a sign-in area to the todo app, with an `input` for typing in a `username` and a sign-in `button`. The app will have two valid `username` values - _"Jane"_ and _"Steve"_. After a successful sign-in, the sign-in area will be replaced by a "Hi [username]" message.

### Backend setup

1. Open a terminal and run the following command to install the required packages:

```sh
npm i cookie-session
npm i --save-dev @types/cookie-session
```

2. Modify the main server module `index.ts` to use the `cookie-session` Express middleware.

   ```ts{5,8-12}
   // src/server/index.ts

   //...

   import session from "cookie-session"

   const app = express()
   app.use(
     session({
       secret: process.env["SESSION_SECRET"] || "my secret"
     })
   )

   //...
   ```

   The `cookie-session` middleware stores session data, digitally signed using the value of the `secret` property, in an `httpOnly` cookie, sent by the browser to all subsequent API requests.

3. add a `shared/AuthController.ts` file and include the following code:

   ```ts add={4-6,8-12}
   // src/shared/AuthController.ts

   import { BackendMethod, remult } from 'remult'
   import type express from 'express'
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   import type from 'cookie-session' // required to access the session member of the request object

   declare module 'remult' {
     export interface RemultContext {
       request?: express.Request
     }
   }

   export class AuthController {
     //
   }
   ```

   ### Code Explanation

   - We import the necessary modules from `remult` and types for `express` and `cookie-session`.
   - We extend the `RemultContext` interface to include an optional `request` property of type `express.Request`.
   - Remult will automatically set the `request` with the current request. Since Remult works with any server framework, we need to type it to the correct server, which in this case is Express. This typing gives us access to the request object and its session, managed by `cookie-session`.
   - This `request` can be accessed using `remult.context.request`.

   Next, we'll add a static list of users and a sign-in method. (In a real application, you would use a database, but for this tutorial, a static list will suffice.)

   ```ts add={1,4-17}
   const validUsers = [{ name: 'Jane' }, { name: 'Alex' }]

   export class AuthController {
     @BackendMethod({ allowed: true })
     static async signIn(name: string) {
       const user = validUsers.find((user) => user.name === name)
       if (user) {
         remult.user = {
           id: user.name,
           name: user.name,
         }
         remult.context.request!.session!['user'] = remult.user
         return remult.user
       } else {
         throw Error("Invalid user, try 'Alex' or 'Jane'")
       }
     }
   }
   ```

   ### Code Explanation

   - We define a static list of valid users.
   - The `signIn` method is decorated with `@BackendMethod({ allowed: true })`, making it accessible from the frontend.
   - The method checks if the provided `name` exists in the `validUsers` list. If it does, it sets `remult.user` to an object that conforms to the `UserInfo` type from Remult and stores this user in the request session.
   - If the user is not found, it throws an error.

   Next, we'll add the sign-out method:

   ```ts add={7-11}
   export class AuthController {
     @BackendMethod({ allowed: true })
     static async signIn(name: string) {
       //...
     }

     @BackendMethod({ allowed: true })
     static async signOut() {
       remult.context.request!.session!['user'] = undefined
       return undefined
     }
   }
   ```

   - The `signOut` method clears the user session, making the user unauthenticated.

4. Update `remultExpress` configuration.

   ```ts{3,5,6}
   // src/server/api.ts

   import { AuthController } from '../shared/AuthController.js'

   export const api = remultExpress({
     //...
     controllers: [TaskController, AuthController]
     getUser: (req) => req.session!['user'],
   })
   ```

   ### Code Explanation

   - Register the `AuthController` so that the frontend can call its `signIn` and `signOut` methods
   - `getUser` function: The getUser function is responsible for extracting the user information from the session. If a user is found in the session, Remult will treat the request as authenticated, and this user will be used for authorization purposes.

### Frontend setup

1. Create an `Auth` component using Angular's cli
   ```sh
   ng g c auth
   ```
2. Add the highlighted code lines to the `AuthComponent` class file:

   ```ts
   // src/app/auth/auth.component.ts

   import { Component, OnInit } from '@angular/core'
   import { CommonModule } from '@angular/common'
   import { UserInfo, remult } from 'remult'
   import { HttpClient, HttpClientModule } from '@angular/common/http'
   import { FormsModule } from '@angular/forms'
   import { TodoComponent } from '../todo/todo.component'

   @Component({
     selector: 'app-auth',
     standalone: true,
     imports: [CommonModule, FormsModule, TodoComponent, HttpClientModule],
     templateUrl: './auth.component.html',
     styleUrl: './auth.component.css',
   })
   export class AuthComponent implements OnInit {
     signInUsername = ''
     remult = remult

     async signIn() {
       try {
         remult.user = await AuthController.signIn(this.signInUsername)
       } catch (error: unknown) {
         alert((error as { message: string }).message)
       }
     }

     async signOut() {
       await AuthController.signOut()
       remult.user = undefined
     }

     ngOnInit() {
       remult.initUser()
     }
   }
   ```

3. Replace the contents of auth.component.html with the following html:

   ```html
   <!-- src/app/auth/auth.component.html -->

   <ng-container *ngIf="!remult.authenticated()">
     <h1>todos</h1>
     <main>
       <form (submit)="signIn()">
         <input
           [(ngModel)]="signInUsername"
           placeholder="Username, try Steve or Jane"
           name="username"
         />
         <button>Sign in</button>
       </form>
     </main>
   </ng-container>
   <ng-container *ngIf="remult.authenticated()">
     <header>
       Hello {{ remult.user?.name }}
       <button (click)="signOut()">Sign Out</button>
     </header>
     <app-todo></app-todo>
   </ng-container>
   ```

4. Replace the `TodoComponent` with the `AuthComponent` in the `AppComponent`

   ```ts{6,12}
   //src/app/app.component.ts

   import { Component, NgZone } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { RouterOutlet } from '@angular/router';
   import { AuthComponent } from './auth/auth.component';
   import { remult } from 'remult';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [CommonModule, RouterOutlet, AuthComponent],
     templateUrl: './app.component.html',
     styleUrl: './app.component.css',
   })

   ```

5. Change the `app.component.html` to use the `AuthComponent` instead of the `TodoComponent`

   ```html
   <!-- src/app/app.component.html -->

   <app-auth></app-auth>
   ```

The todo app now supports signing in and out, with **all access restricted to signed in users only**.

## Role-based Authorization

Usually, not all application users have the same privileges. Let's define an `admin` role for our todo app, and enforce the following authorization rules:

- All signed in users can see the list of tasks.
- All signed in users can set specific tasks as `completed`.
- Only users belonging to the `admin` role can create, delete or edit the titles of tasks.

1. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

```ts{7-8,18}
// src/shared/Task.ts

import { Allow, Entity, Fields, Validators } from "remult"

@Entity<Task>("tasks", {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: "admin",
  allowApiDelete: "admin"
})
export class Task {
  @Fields.uuid()
  id!: string

  @Fields.string({
    validate: (task) => {
      if (task.title.length < 3) throw "Too Short"
    }
    allowApiUpdate: "admin"
  })
  title = ""

  @Fields.boolean()
  completed = false
}
```

2. Let's give the user _"Jane"_ the `admin` role by modifying the `roles` array of her `validUsers` entry.

```ts{3,13}
// src/shared/AuthController.ts

const validUsers = [{ name: "Jane", admin: true }, { name: "Steve" }];

export class AuthController {
  @BackendMethod({ allowed: true })
  static async signIn(name: string) {
    const user = validUsers.find((user) => user.name === name);
    if (user) {
      remult.user = {
        id: user.name,
        name: user.name,
        roles: user.admin ? ["admin"] : [],
      };
      remult.context.request!.session!["user"] = remult.user;
      return remult.user;
    } else {
      throw Error("Invalid user, try 'Steve' or 'Jane'");
    }
  }
```

**Sign in to the app as _"Steve"_ to test that the actions restricted to `admin` users are not allowed. :lock:**

## Role-based Authorization on the Frontend

From a user experience perspective it only makes sense that users that can't add or delete, would not see these buttons.

Let's reuse the same definitions on the Frontend.

Modify the contents of todo.component.html to only display the form and delete buttons if these operations are allowed based on the entity's metadata:

```html{5,22}
<!-- src/app/todo/todo.component.html -->

<h1>todos</h1>
<main>
  <form *ngIf="taskRepo.metadata.apiInsertAllowed()" (submit)="addTask()">
    <input
      placeholder="What needs to be done?"
      [(ngModel)]="newTaskTitle"
      name="newTaskTitle"
    />
    <button>Add</button>
  </form>
  <div *ngFor="let task of tasks">
    <input
      type="checkbox"
      [(ngModel)]="task.completed"
      (change)="saveTask(task)"
    />
    <input [(ngModel)]="task.title" />
    <button (click)="saveTask(task)">Save</button>
    <button
      *ngIf="taskRepo.metadata.apiDeleteAllowed(task)"
      (click)="deleteTask(task)"
    >
      Delete
    </button>
  </div>
  <div>
    <button (click)="setAllCompleted(true)">Set all as completed</button>
    <button (click)="setAllCompleted(false)">Set all as uncompleted</button>
  </div>
</main>
```

This way we can keep the frontend consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values,
