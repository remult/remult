# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use a [cookie-session](https://www.npmjs.com/package/cookie-session) authentication. The `user` property of the session will be set by the API server upon a successful simplistic sign-in (based on username without password).

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

In this section, we'll be using the following packages:
* [cookie-session](cookie-session) to store the signed in user information

1. Open a terminal and run the following command to install the required packages:
   
```sh
npm i cookie-session
npm i --save-dev @types/cookie-session
```

2. Modify the main server module `index.ts` to use the `cookie-session` authentication Express middleware. 

   *src/server/index.ts*
   ```ts{3,6-8}
   import express from "express";
   import { api } from "./api";
   import session from "cookie-session";
   
   const app = express();
   app.use(session({
       secret: process.env['SESSION_SECRET'] || "my secret"
   }));
   app.use(api);
   app.listen(3002, () => console.log("Server started"));
   ```

   The `cookie-session` middleware users cookies to manage a session, and requires a `secret` to verify that the info wasn't tempered with.

3. Create a file `src/server/auth.ts` and place the following code in it:
   
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

   This (very) simplistic `signIn` function accepts a `username` argument, looks it up in a predefined dictionary of valid users and if found sets it to the `user` property of the request's `session`.
   
   
   **This is a good place to note that with remult you are not bound to using Backend method, and can use standard express routes as we do here**

4. In the `src/server/index.ts` register the `auth` route.
   
   *src/server/index.ts*
   ```ts{4,10}
   import express from "express";
   import { api } from "./api";
   import session from "cookie-session";
   import { auth } from "./auth";
   
   const app = express();
   app.use(session({
       secret: process.env['TOKEN_SIGN_KEY'] || "my secret"
   }));
   app.use(auth);
   app.use(api);
   app.listen(3002, () => console.log("Server started"));
   ```

5. In the `src/server/api.ts` set the `getUser` method to instruct remult on how to get the current user.
   
   *src/server/api.ts*
   ```ts{9}
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { remult } from 'remult';
   import { TasksController } from '../shared/TasksController';
   
   export const api = remultExpress({
       entities: [Task],
       controllers: [TasksController],
       getUser: request => request.session!['user'],
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

6. Create a file `src/Auth.tsx` and place the following code in it
   *src/Auth.tsx*
   ```ts
   import { useEffect, useState } from "react";
   import { UserInfo } from "remult";
   
   const Auth: React.FC<{ children: JSX.Element }> = ({ children }) => {
       const [signInUsername, setSignInUsername] = useState("");
       const [currentUser, setCurrentUser] = useState<UserInfo>();
   
       const signIn = async () => {
           const result = await fetch('/api/signIn', {
               method: "POST",
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({ username: signInUsername })
           });
           if (result.ok) {
               setCurrentUser(await result.json());
               setSignInUsername("");
           }
           else alert(await result.json());
       }
       const signOut = async () => {
           await fetch('/api/signOut', {
               method: "POST"
           });
           setCurrentUser(undefined);
       }
       useEffect(() => {
           fetch('/api/currentUser').then(r => r.json())
               .then(async currentUserFromServer => {
                   setCurrentUser(currentUserFromServer)
               });
       }, []);
   
       if (!currentUser)
           return (
               <header>
                   <input value={signInUsername}
                       onChange={e => setSignInUsername(e.target.value)}
                       placeholder="Username, try Steve or Jane" />
                   <button onClick={signIn}>Sign in</button>
               </header>);
       return <>
           <header>
               Hello {currentUser.name} <button onClick={signOut}>Sign Out</button>
           </header>
           {children}
       </>
   }
   export default Auth;
   ```
7. In the `main.tsx` file, wrap the `App` component with the `Auth` component
   *src/main.tsx*
   ```ts{4,9-11}
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App'
   import Auth from './Auth'
   import './index.css'
   
   ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
     <React.StrictMode>
       <Auth>
         <App />
       </Auth>
     </React.StrictMode>
   )
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
```

**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**