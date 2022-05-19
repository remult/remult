# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use a [JWT Bearer token](https://jwt.io) authentication. JSON web tokens will be issued by the API server upon a successful simplistic sign-in (based on username without password) and sent in all subsequent API requests using an [Authorization HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization).

## Tasks CRUD Requires Sign-in
This rule is implemented within the `Task` `@Entity` decorator, by modifying the value of the `allowApiCrud` property.
This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

*src/shared/Task.ts*
```ts{2}
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

::: tip Use authorization metadata to avoid redundant api requests
Although not necessary, it's a good idea to avoid sending `GET` api requests for tasks from our Angular app, if the current user is not authorized to access the endpoint.

A simple way to achieve this is by adding the highlighted code lines to the `fetchTasks` method in `AppComponent`:

*src/app/app.component.ts*
```ts{2-3}
async fetchTasks() {
  if (!this.taskRepo.metadata.apiReadAllowed)
    return;
  this.tasks = await this.taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: this.hideCompleted ? false : undefined }
  });
}
```
:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `TasksController`.

*src/shared/TasksController.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
::: warning Import Allow
This code requires adding an import of `Allow` from `remult`.
:::
:::

## User Authentication
Let's add a sign-in area to the todo app, with an `input` for typing in a `username` and a sign-in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign-in, the sign-in area will be replaced by a "Hi [username]" message.

In this section, we'll be using the following packages:
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to create JSON web tokens
* [@auth0/angular-jwt](https://github.com/auth0/angular2-jwt) for client-side JWT decoding and passing HTTP `Authorization` headers to the API server
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server

1. Open a terminal and run the following command to install the required packages:
   
```sh
npm i jsonwebtoken @auth0/angular-jwt express-jwt
npm i --save-dev  @types/jsonwebtoken 
```

2. Modify the main server module `index.ts` to use the `express-jwt` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{3,6-10}
   import express from 'express';
   import { api } from './api';
   import { expressjwt } from 'express-jwt';
   
   const app = express();
   app.use(expressjwt({
       secret: process.env['JWT_SECRET'] || "my secret",
       credentialsRequired: false,
       algorithms: ['HS256']
   }));
   app.use(api);

   app.listen(3002, () => console.log("Server started"));
   ```

   The `expressjwt` middleware verifies that the authentication token is valid, and extracts the user info from it to be used on the server.

   `credentialsRequired` is set to `false` to allow unauthenticated API requests to reach Remult. We'll use Remult's decorators to define which resources are available for unauthenticated users and which resources require authentication.

   The `algorithms` property must contain the algorithm used to sign the JWT (`HS256` is the default algorithm used by `jsonwebtoken`).

3. Create a file `src/app/auth.service.ts` and place the following code in it:

*src/app/auth.service.ts*
```ts
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Remult } from 'remult';

@Injectable({
      providedIn: 'root'
})
export class AuthService {
      constructor(private remult: Remult) {
         const token = AuthService.fromStorage();
         if (token) {
            this.setAuthToken(token);
         }
      }

      // Passes the decoded user information to Remult and stores the token in the local sessionStorage.
      setAuthToken(token: string | null) {
         if (token) {
            this.remult.setUser(new JwtHelperService().decodeToken(token));
            sessionStorage.setItem(AUTH_TOKEN_KEY, token);
         }
         else {
            this.remult.setUser(undefined!);
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
         }
      }

      static fromStorage(): string {
         return sessionStorage.getItem(AUTH_TOKEN_KEY)!;
      }
}

const AUTH_TOKEN_KEY = "authToken";
```

4. Add `JwtModule` to the `imports` section of the `@NgModule` decorator of the `AppModule` class.

*src/app/app.module.ts*
```ts
// Add the authorization token header to all API requests.
JwtModule.forRoot({
   config:{
      tokenGetter: () => AuthService.fromStorage()
   }
})
```
::: warning Imports
This code requires imports for `AuthService` from `./auth.service` and `JwtModule` from `@auth0/angular-jwt`.
:::   

5. Create a file `src/shared/AuthController.ts` and place the following code in it:

   *src/shared/AuthController.ts*
   ```ts
   import { BackendMethod } from 'remult';

   export class AuthController {
      @BackendMethod({ allowed: true })
      static async signIn(username: string) {
         const validUsers = [
            { id: "1", name: "Jane", roles: [] },
            { id: "2", name: "Steve", roles: [] }
         ];
         const user = validUsers.find(user => user.name === username);

         if (!user)
            throw new Error("Invalid user, try 'Steve' or 'Jane'");
         return (await import('jsonwebtoken')).sign(user, process.env['JWT_SECRET'] || "my secret");
      }
   }
   ```

   This (very) simplistic `signIn` function accepts a `username` argument, looks it up in a predefined dictionary of valid users, and returns a JWT string signed with a secret key. 

   Since `jsonwebtoken` is used in a `BackendMethod` that is defined in shared code, it's important to exclude it from browser builds by using a dynamic import.

::: warning JWT payload
The payload of the JWT must contain an object which implements the Remult `UserInfo` interface, which consists of a string `id`, a string `name` and an array of string `roles`.
:::

6. Register the `AuthController` in the `controllers` array of the `options` object passed to `remultExpress()`.

*src/server/api.ts*
```ts{4,8}
import { remultExpress } from "remult/remult-express";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";
import { AuthController } from "../shared/AuthController";

export const api = remultExpress({
   entities: [Task],
   controllers: [TasksController, AuthController],
   initApi: async remult => {
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

7. Add the following code to the `AppComponent` class, replacing the existing `constructor`.

*src/app/app.component.ts*
```ts
constructor(public remult: Remult, private auth: AuthService) {
}
username = '';
async signIn() {
   try {
      this.auth.setAuthToken(await AuthController.signIn(this.username));
      this.fetchTasks();
   } catch (error: any) {
      alert(error.message);
   }
}

signOut() {
   this.auth.setAuthToken(null);
   this.tasks = [];
}
```

::: warning Imports
This code requires imports for `AuthService` from `./auth.service` and `AuthController` from `./shared/AuthController`.
:::

8. Add the following `HTML` to the `app.component.html` template.

*src/app/app.component.html*
```html{1-9,25}
<ng-container *ngIf="!remult.authenticated()">
   <input [(ngModel)]="username">
   <button (click)="signIn()">Sign in</button>
</ng-container>
<ng-container *ngIf="remult.authenticated()">
   <div>
      Hi {{remult.user.name}}
      <button (click)="signOut()">Sign out</button>
   </div>
   <input type="checkbox" [(ngModel)]="hideCompleted" (change)="fetchTasks()" />
   Hide Completed
   <hr />
   <div *ngFor="let task of tasks">
      <input type="checkbox" [(ngModel)]="task.completed">
      <input [(ngModel)]="task.title">
      {{task.error?.modelState?.title}}
      <button (click)="saveTask(task)">Save</button>
      <button (click)="deleteTask(task)">Delete</button>
   </div>
   <button (click)="addTask()">Add Task</button>
   <div>
      <button (click)="setAll(true)">Set all as completed</button>
      <button (click)="setAll(false)">Set all as uncompleted</button>
   </div>
</ng-container>
```

The todo app now supports signing in and out, with **all access restricted to signed in users only**.

## Role-based Authorization
Usually, not all application users have the same privileges. Let's define an `admin` role for our todo app, and enforce the following authorization rules:

* All signed in users can see the list of tasks.
* All signed in users can set specific tasks as `completed`.
* Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
* Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/shared/` folder, with the following `Roles`:

*src/shared/Roles.ts*
```ts
export const Roles = {
   admin: 'admin'
}
```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

*src/shared/Task.ts*
```ts{2,5-8,16}
import { Allow, Entity, Fields, Validators } from "remult";
import { Roles } from "./Roles";

@Entity<Task>("tasks", {
      allowApiRead: Allow.authenticated,
      allowApiUpdate: Allow.authenticated,
      allowApiInsert: Roles.admin,
      allowApiDelete: Roles.admin
})
export class Task {
      @Fields.uuid()
      id!: string;

      @Fields.string({
         validate: Validators.required,
         allowApiUpdate: Roles.admin
      })
      title = '';

      @Fields.boolean()
      completed = false;
}
```

3. Modify the highlighted line in the `TasksController` class to reflect the fourth authorization rule.

*src/shared/TasksController.ts*
```ts{3,6}
import { Allow, BackendMethod, Remult } from "remult";
import { Task } from "./Task";
import { Roles } from "./Roles";

export class TasksController {
   @BackendMethod({ allowed: Roles.admin })
   static async setAll(completed: boolean, remult?: Remult) {
      const taskRepo = remult!.repo(Task);

      for (const task of await taskRepo.find()) {
            await taskRepo.save({ ...task, completed });
      }
   }
}
```

4. Let's give the user *"Jane"* the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` function.

*src/shared/AuthController.ts*
```ts{3,9}
import * as jwt from 'jsonwebtoken';
import { BackendMethod } from 'remult';
import { Roles } from './Roles';

export class AuthController {
   @BackendMethod({ allowed: true })
   static async signIn(username: string) {
      const validUsers = [
            { id: "1", name: "Jane", roles: [Roles.admin] },
            { id: "2", name: "Steve", roles: [] }
      ];
      const user = validUsers.find(user => user.name === username);

      if (!user)
            throw new Error("Invalid user, try 'Steve' or 'Jane'");
      return jwt.sign(user, process.env['JWT_SECRET'] || "my secret");
   }
}
```

**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**