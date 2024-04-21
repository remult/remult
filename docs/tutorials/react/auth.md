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

3. Create a file `src/server/auth.ts` for the `auth` express router and place the following code in it:

   ```ts
   // src/server/auth.ts

   import express, { Router } from 'express'
   import type { UserInfo } from 'remult'

   const validUsers: UserInfo[] = [
     { id: '1', name: 'Jane' },
     { id: '2', name: 'Steve' },
   ]

   export const auth = Router()

   auth.use(express.json())

   auth.post('/api/signIn', (req, res) => {
     const user = validUsers.find((user) => user.name === req.body.username)
     if (user) {
       req.session!['user'] = user
       res.json(user)
     } else {
       res.status(404).json("Invalid user, try 'Steve' or 'Jane'")
     }
   })

   auth.post('/api/signOut', (req, res) => {
     req.session!['user'] = null
     res.json('signed out')
   })

   auth.get('/api/currentUser', (req, res) => res.json(req.session!['user']))
   ```

   - The (very) simplistic `signIn` endpoint accepts a request body with a `username` property, looks it up in a predefined dictionary of valid users and, if found, sets the user's information to the `user` property of the request's `session`.

   - The `signOut` endpoint clears the `user` value from the current session.

   - The `currentUser` endpoint extracts the value of the current user from the session and returns it in the API response.

4. Register the `auth` router in the main server module.

   ```ts{5,13}
   // src/server/index.ts

   //...

   import { auth } from "./auth"

   const app = express()
   app.use(
     session({
       secret: process.env["SESSION_SECRET"] || "my secret"
     })
   )
   app.use(auth)

   //...
   ```

### Frontend setup

1. Create a file `src/Auth.tsx` and place the following `Auth` component code in it:

   ```ts
   // src/Auth.tsx

   import { FormEvent, useEffect, useState } from "react"
   import { remult } from "remult"
   import App from "./App"

   export default function Auth() {
     const [username, setUsername] = useState("")
     const [signedIn, setSignedIn] = useState(false)

     const signIn = async (e: FormEvent) => {
       e.preventDefault()
       const result = await fetch("/api/signIn", {
         method: "POST",
         headers: {
           "Content-Type": "application/json"
         },
         body: JSON.stringify({ username })
       })
       if (result.ok) {
         remult.user = await result.json()
         setSignedIn(true)
         setUsername("")
       } else {
         alert(await result.json())
       }
     }

     const signOut = async () => {
       await fetch("/api/signOut", {
         method: "POST"
       })
       remult.user = undefined
       setSignedIn(false)
     }
     useEffect(() => {
       fetch("/api/currentUser").then(async r => {
         remult.user = await r.json()
         if (remult.user) setSignedIn(true)
       })
     }, [])

     if (!signedIn)
       return (
         <>
           <h1>Todos</h1>
           <main>
             <form onSubmit={signIn}>
               <input
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 placeholder="Username, try Steve or Jane"
               />
               <button>Sign in</button>
             </form>
           </main>
         </>
       )
     return (
       <>
         <header>
           Hello {remult.user!.name} <button onClick={signOut}>Sign Out</button>
         </header>
         <App />
       </>
     )
   }
   ```

2. In the `main.tsx` file, Replace the `App` component with the `Auth` component.

   ```ts{5,10}
   // src/main.tsx

   import React from "react"
   import ReactDOM from "react-dom/client"
   import Auth from "./Auth"
   import "./index.css"

   ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
     <React.StrictMode>
       <Auth />
     </React.StrictMode>
   )
   ```

### Connect Remult middleware

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that extracts a `UserInfo` object from a `Request`.

```ts{7}
// src/server/api.ts

//...

export const api = remultExpress({
  //...
  getUser: req => req.session!["user"]
})
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

```ts{4}
// src/server/auth.ts

const validUsers = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve" }
]
```

**Sign in to the app as _"Steve"_ to test that the actions restricted to `admin` users are not allowed. :lock:**

## Role-based Authorization on the Frontend

From a user experience perspective it only makes sense that users that can't add or delete, would not see these buttons.

Let's reuse the same definitions on the Frontend.

We'll use the entity's metadata to only show the form if the user is allowed to insert

```tsx{4,13}
// src/App.tsx

<main>
  {taskRepo.metadata.apiInsertAllowed() && (
    <form onSubmit={addTask}>
      <input
        value={newTaskTitle}
        placeholder="What needs to be done?"
        onChange={e => setNewTaskTitle(e.target.value)}
      />
      <button>Add</button>
    </form>
  )}
  ...
</main>
```

And let's do the same for the `delete` button:

```tsx{12,14}
// src/App.tsx

return (
  <div key={task.id}>
    <input
      type="checkbox"
      checked={task.completed}
      onChange={e => setCompleted(e.target.checked)}
    />
    <input value={task.title} onChange={e => setTitle(e.target.value)} />
    <button onClick={saveTask}>Save</button>
    {taskRepo.metadata.apiDeleteAllowed(task) && (
      <button onClick={deleteTask}>Delete</button>
    )}
  </div>
)
```

This way we can keep the frontend consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values.
