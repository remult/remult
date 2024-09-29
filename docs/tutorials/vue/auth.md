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

1. Create a file `src/Auth.vue` and place the following `Auth` component code in it:

   ```vue
   // src/Auth.vue

   <script setup lang="ts">
   import { onMounted, ref } from 'vue'
   import { remult } from 'remult'
   import App from './App.vue'
   import { AuthController } from './shared/AuthController'

   const username = ref('')
   const signedIn = ref(false)

   const signIn = async () => {
     try {
       remult.user = await AuthController.signIn(username)
       signedIn.value = true
       username.value = ''
     } catch (error: unknown) {
       alert((error as { message: string }).message)
     }
   }
   const signOut = async () => {
     await AuthController.signOut()
     remult.user = undefined
     signedIn.value = false
   }

   onMounted(async () => {
     await remult.initUser()
     signedIn.value = remult.authenticated()
   })
   </script>
   <template>
     <div v-if="!signedIn">
       <h1>todos</h1>
       <main>
         <form @submit.prevent="signIn()">
           <input
             v-model="username"
             placeholder="Username, try Steve or Jane"
           />
           <button>Sign in</button>
         </form>
       </main>
     </div>
     <div v-else>
       <header>
         Hello {{ remult.user!.name }}
         <button @click="signOut()">Sign Out</button>
       </header>
       <App />
     </div>
   </template>
   ```

2. In the `main.vue` file, change the `rootComponent` to `Auth`.

   ```ts{4,8}
   // src/main.ts

   import { createApp } from "vue"
   import Auth from "./Auth.vue"

   import "./assets/main.css"

   createApp(Auth).mount("#app")
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

We'll use the entity's metadata to only show the form if the user is allowed to insert

```vue{8,23}
// src/App.vue

<template>
  <div>
    <h1>todos</h1>
    <main>
      <form
        v-if="taskRepo.metadata.apiInsertAllowed()"
        @submit.prevent="addTask()"
      >
        <input v-model="newTaskTitle" placeholder="What needs to be done?" />
        <button>Add</button>
      </form>
      <div v-for="task in tasks">
        <input
          type="checkbox"
          v-model="task.completed"
          @change="saveTask(task)"
        />
        <input v-model="task.title" />
        <button @click="saveTask(task)">Save</button>
        <button
          v-if="taskRepo.metadata.apiDeleteAllowed(task)"
          @click="deleteTask(task)"
        >
          Delete
        </button>
      </div>
      <div>
        <button @click="setAllCompleted(true)">Set All as Completed</button>
        <button @click="setAllCompleted(false)">Set All as Uncompleted</button>
      </div>
    </main>
  </div>
</template>
```

This way we can keep the frontend consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values.
