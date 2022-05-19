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
Although not necessary, it's a good idea to avoid sending `GET` api requests for tasks from our Vue app, if the current user is not authorized to access the endpoint.

A simple way to achieve this is by adding the highlighted code lines to the `fetchTasks` function in `App.vue`:

*src/App.vue*
```ts{2-3}
async function fetchTasks() {
  if (!taskRepo.metadata.apiReadAllowed)
    return;
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
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
* [jwt-decode](https://github.com/auth0/jwt-decode) for client-side JWT decoding.
* [express-jwt](https://github.com/auth0/express-jwt) to read HTTP `Authorization` headers and validate JWT on the API server

1. Open a terminal and run the following command to install the required packages:
   
```sh
npm i jsonwebtoken jwt-decode express-jwt
npm i --save-dev @types/jsonwebtoken 
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

3. Add the highlighted code to `common.ts`:

   *src/common.ts*
   ```ts{3,7-28}
   import axios from 'axios';
   import { Remult } from "remult";
   import jwtDecode from 'jwt-decode';

   export const remult = new Remult(axios);

   const AUTH_TOKEN_KEY = "authToken";

   export function setAuthToken(token: string | null) {
      if (token) {
         remult.setUser(jwtDecode(token));
         sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      else {
         remult.setUser(undefined!);
         sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
   }

   // Initialize the auth token from session storage when the application loads
   setAuthToken(sessionStorage.getItem(AUTH_TOKEN_KEY));

   axios.interceptors.request.use(config => {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (token)
         config.headers!["Authorization"] = "Bearer " + token;
      return config;
   });
   ```

   `setAuthToken` sends the decoded user information to Remult and store the token in local `sessionStorage`.

   An `axios` interceptor is used to add the authorization token header to all API requests.

4. Create a file `src/shared/AuthController.ts` and place the following code in it:

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

5. Register the `AuthController` in the `controllers` array of the `options` object passed to `remultExpress()`.

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

6. Add a the highlighted code to the `App` component:

*src/App.vue*
```vue{4-5,40-54,58-67,82}
<script setup lang="ts">
import type { ErrorInfo } from 'remult';
import { onMounted, ref } from 'vue'
import { remult, setAuthToken } from './common';
import { AuthController } from './shared/AuthController';
import { Task } from './shared/Task';
import { TasksController } from './shared/TasksController';

const taskRepo = remult.repo(Task);
const tasks = ref<(Task & { error?: ErrorInfo<Task> })[]>([]);
const hideCompleted = ref(false);
async function fetchTasks() {
  if (!taskRepo.metadata.apiReadAllowed)
    return;
  tasks.value = await taskRepo.find({
    orderBy: { completed: "asc" },
    where: { completed: hideCompleted.value ? false : undefined }
  });
}
async function saveTask(task: (Task & { error?: ErrorInfo<Task> })) {
  try {
    const savedTask = await taskRepo.save(task);
    tasks.value = tasks.value.map(t => t === task ? savedTask : t);
  } catch (error: any) {
    alert(error.message);
    task.error = error;
  }
}
function addTask() {
  tasks.value.push(new Task());
}
async function deleteTask(task: Task) {
  await taskRepo.delete(task);
  tasks.value = tasks.value.filter(t => t !== task);
}
async function setAll(completed: boolean) {
  await TasksController.setAll(completed);
  fetchTasks();
}
const username = ref('');
const signIn = async () => {
  try {
    setAuthToken(await AuthController.signIn(username.value));
    window.location.reload();
  }
  catch (error: any) {
    alert(error.message);
  }
}

const signOut = () => {
  setAuthToken(null);
  window.location.reload();
}
onMounted(() => fetchTasks())
</script>
<template>
  <template v-if="!remult.authenticated()">
    <p>
      <input v-model="username" />
      <button @click="signIn()">Sign in</button>
    </p>
  </template>
  <template v-if="remult.authenticated()">
    <p>
      Hi {{ remult.user.name }} <button @click="signOut()">Sign out</button>
    </p>
    <input type="checkbox" v-model="hideCompleted" @change="fetchTasks()" /> Hide Completed {{ hideCompleted }}
    <hr />
    <div v-for="task in tasks">
      <input type="checkbox" v-model="task.completed" />
      <input v-model="task.title" />
      {{ task.error?.modelState?.title }}
      <button @click="saveTask(task)">Save</button>
      <button @click="deleteTask(task)">Delete</button>
    </div>
    <button @click="addTask()">Add Task</button>
    <div>
      <button @click="setAll(true)">Set all as completed</button>
      <button @click="setAll(false)">Set all as uncompleted</button>
    </div>
  </template>
</template>
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
      return (await import('jsonwebtoken')).sign(user, process.env['JWT_SECRET'] || "my secret");
   }
}
```

**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**