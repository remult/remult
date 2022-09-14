# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use `Express`'s [cookie-session](https://expressjs.com/en/resources/middleware/cookie-session.html) middleware to store an authenticated user's session within a cookie. The `user` property of the session will be set by the API server upon a successful simplistic sign-in (based on username without password).

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


::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAll` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAll` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAll` method of `TasksController`.

*src/shared/TasksController.ts*
```ts
@BackendMethod({ allowed: Allow.authenticated })
```
**This code requires adding an import of `Allow` from `remult`.**
:::

## User Authentication
Let's add a sign-in area to the todo app, with an `input` for typing in a `username` and a sign-in `button`. The app will have two valid `username` values - *"Jane"* and *"Steve"*. After a successful sign-in, the sign-in area will be replaced by a "Hi [username]" message.

### Backend setup

1. Open a terminal and run the following command to install the required packages:
   
```sh
npm i cookie-session
npm i --save-dev @types/cookie-session
```

2. Modify the main server module `index.ts` to use the `cookie-session` Express middleware. 

   *src/server/index.ts*
   ```ts{3,6-8}
   //...

   import session from "cookie-session";
   
   const app = express();
   app.use(session({
       secret: process.env['SESSION_SECRET'] || "my secret"
   }));

   //...
   ```

   The `cookie-session` middleware stores session data, digitally signed using the value of the `secret` property, in an `httpOnly` cookie, sent by the browser to all subsequent API requests.

3. Create a file `src/server/auth.ts` for the `auth` express router and place the following code in it:
   
   *src/server/auth.ts*
   ```ts
   import express, { Router } from "express";

   export const auth = Router();

   auth.use(express.json());
   
   export const validUsers = [
       { id: "1", name: "Jane", roles: [] },
       { id: "2", name: "Steve", roles: [] },
   ];

   auth.post("/api/signIn", (req, res) => {
       const user = validUsers.find((user) => user.name === req.body.username);
       if (user) {
           req.session!['user'] = user;
           res.json(user);
       } else {
           res.status(404).json("Invalid user, try 'Steve' or 'Jane'");
       }
   });
   
   auth.post("/api/signOut", (req, res) => {
       req.session!['user'] = null;
       res.json("signed out");
   });
   
   auth.get("/api/currentUser", (req, res) =>
       res.json(req.session!['user'])
   );
   ```

   * The (very) simplistic `signIn` endpoint accepts a request body with a `username` property, looks it up in a predefined dictionary of valid users and, if found, sets the user's information to the `user` property of the request's `session`.

   * The `signOut` endpoint clears the `user` value from the current session.

   * The `currentUser` endpoint extracts the value of the current user from the session and returns it in the API response.

4. Register the `auth` router in the main server module.
   
   *src/server/index.ts*
   ```ts{3,9}
   //...

   import { auth } from "./auth";
   
   const app = express();
   app.use(session({
       secret: process.env['TOKEN_SIGN_KEY'] || "my secret"
   }));
   app.use(auth);

   //...
   ```

### Frontend setup
1. Create an `Auth` component using Angular's cli
   ```sh
   ng g c auth
   ```
2. Add the highlighted code lines to the `AuthComponent` class file:
   *src/app/auth/auth.component.ts*
   ```ts{2-3,12-38}
   import { Component, OnInit } from '@angular/core';
   import { HttpClient } from '@angular/common/http';
   import { UserInfo } from 'remult';
   
   
   @Component({
     selector: 'app-auth',
     templateUrl: './auth.component.html',
     styleUrls: ['./auth.component.css']
   })
   export class AuthComponent implements OnInit {
     constructor(private http: HttpClient) { }
   
     signInUsername = '';
     currentUser?: UserInfo;
   
     signIn() {
       this.http.post<UserInfo>('/api/signIn',
         {
           username: this.signInUsername
         }).subscribe({
           next: user => {
             this.currentUser = user;
             this.signInUsername = '';
           },
           error: error => alert(error.error)
         });
     }
   
     signOut() {
       this.http.post('/api/signOut', {})
         .subscribe(() => this.currentUser = undefined);
     }
   
     ngOnInit() {
       this.http.get<UserInfo>('/api/currentUser')
         .subscribe(user => this.currentUser = user)
     }
   
   }
   ```
3. Replace the contents of auth.component.html with the following html:
   *src/app/auth/auth.component.ts*
   ```html
   <header *ngIf="!currentUser">
       <input
           [(ngModel)]="signInUsername"
           placeholder="Username, try Steve or Jane"
       >
       <button (click)="signIn()">Sign in</button>
   </header>
   <ng-container *ngIf="currentUser">
       <header>
           Hello {{currentUser.name}}
           <button (click)="signOut()">Sign Out</button>
       </header>
       <app-todo></app-todo>
   </ng-container>
   ```
4. Change the `app.component.html` to use the `AuthComponent` instead of the `TodoComponent`
   
   *src/app/app.component.html*
   ```html
   <app-auth></app-auth>
   ```

### Connect Remult middleware

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that extracts a `UserInfo` object from a `Request`.

*src/server/api.ts*
```ts{5}
//...

export const api = remultExpress({
    //...
    getUser: request => request.session!['user']
});
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
import { Allow, BackendMethod, remult } from "remult";
import { Task } from "./Task";
import { Roles } from "./Roles";

export class TasksController {
   @BackendMethod({ allowed: Roles.admin })
   static async setAll(completed: boolean) {
      const taskRepo = remult.repo(Task);

      for (const task of await taskRepo.find()) {
            await taskRepo.save({ ...task, completed });
      }
   }
}
```

4. Let's give the user *"Jane"* the `admin` role by modifying the `roles` array of her `validUsers` entry in the `signIn` function.

*src/server/auth.ts*
```ts{2,8}
import express, { Router } from "express";
import { Roles } from "../shared/Roles";

export const auth = Router();
auth.use(express.json());

export const validUsers = [
    { id: "1", name: "Jane", roles: [Roles.admin] },
    { id: "2", name: "Steve", roles: [] },
];
//...
```

**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**