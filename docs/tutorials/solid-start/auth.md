# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use method outlined in the [Authentication](https://start.solidjs.com/advanced/session/) article of `SolidStart`

## Tasks CRUD Requires Sign-in

This rule is implemented within the `Task` `@Entity` decorator, by modifying the value of the `allowApiCrud` property.
This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

```ts{4}
// src/app/shared/Task.ts

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
curl -i http://localhost:3000/api/tasks
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

Let's set-up `SolidStart` authentication to authenticate users to our app.

### Backend setup

1. Create an `auth.ts` file in the `src` folder with the following code.

   ```ts
   // src/auth.ts

   import { action, redirect } from '@solidjs/router'
   import { useSession } from 'vinxi/http'
   import { type UserInfo } from 'remult'

   const validUsers: UserInfo[] = [
     { id: '1', name: 'Jane' },
     { id: '2', name: 'Steve' },
   ]

   export async function getSession() {
     'use server'
     return await useSession<{ user?: UserInfo }>({
       password:
         process.env['SESSION_SECRET'] ||
         'Something secret used for development only',
     })
   }

   export const loginAction = action(async (formData: FormData) => {
     'use server'
     const username = String(formData.get('username'))
     try {
       const session = await getSession()
       const user = validUsers.find((x) => x.name === username)
       if (!user) throw Error("Invalid user, try 'Steve' or 'Jane'")
       await session.update({ user })
     } catch (err) {
       return err as Error
     }
     throw redirect('/')
   }, 'login')

   export async function logout() {
     'use server'
     const session = await getSession()
     await session.update({ user: null! })
   }

   export async function getUser() {
     'use server'
     const session = await getSession()
     return session?.data?.user
   }
   ```

   - The (very) simplistic `loginAction` endpoint accepts a `FormData` with a `username` property, looks it up in a predefined dictionary of valid users and, if found, sets the user's information to the `user` property of the request's `session`.

   - The `logout` function clears the `user` value from the current session.

   - The `getUser` function extracts the value of the current user from the session and returns it.

2. Create a `src/routes/login.tsx` file, and place the following code to it:

   ```tsx
   // src/routes/login.tsx

   import { useSubmission } from '@solidjs/router'
   import { loginAction } from '../auth.js'
   import { Show } from 'solid-js'

   export default function Home() {
     const sub = useSubmission(loginAction)
     return (
       <>
         <h1>Login</h1>
         <main>
           <form action={loginAction} method="post">
             <input
               type="text"
               name="username"
               placeholder="Username, try Steve or Jane"
             />
             <button>Sign in</button>
           </form>
           <Show when={sub.result?.message}>{sub.result?.message}</Show>
         </main>
       </>
     )
   }
   ```

3. Replace the content of the `src/routes/index.tsx` file with the following code:

   ```tsx
   // src/routes/index.tsx

   import { getUser, logout } from '../auth.js'
   import { useNavigate } from '@solidjs/router'
   import { Show, createSignal, onMount } from 'solid-js'
   import { remult } from 'remult'
   import Todo from '../components/Todo.jsx'

   export default function Home() {
     const [authenticated, setAuthenticated] = createSignal(false)
     const navigate = useNavigate()

     onMount(async () => {
       remult.user = await getUser()
       if (remult.authenticated()) setAuthenticated(true)
       else navigate('/login')
     })

     return (
       <Show when={authenticated()}>
         <h1>Todos</h1>
         <header>
           Hello {remult.user?.name}
           <button
             onClick={async () => logout().then(() => navigate('/login'))}
           >
             Logout
           </button>
         </header>
         <Todo />
       </Show>
     )
   }
   ```

   - We use the `onMount` hook the update the `remult.user` in the `frontend`, based on the user from the current session. That user info can then be used in the front-end for user roles based content

::: warning Solid Hydration error or page not found
As we were working on this tutorial with the rc version of solid start we got this error - we found that **hard refreshing the site (Ctrl F5) solves it**.
:::

### Connect remult-solid-start On the Backend

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function from the `src/auth.ts`

```ts{3,7}
// src/api.ts

import { getUser } from "./auth.js"

export const api = remultApi({
  //...
  getUser,
})
//...
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

import { Allow, Entity, Fields } from "remult"

@Entity<Task>("tasks", {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: "admin",
  allowApiDelete: "admin"
})
export class Task {
  @Fields.id()
  id!: string

  @Fields.string({
    validate: (task) => task.title.length > 2 || "Too Short",
    allowApiUpdate: "admin"
  })
  title = ""

  @Fields.boolean()
  completed = false
}
```

2. Let's give the user _"Jane"_ the `admin` role by modifying the `roles` array of her `validUsers` entry.

```ts{4}
// src/auth.ts

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
// src/components/Todo.tsx

<main>
  <Show when={taskRepo.metadata.apiInsertAllowed()}>
    <form onSubmit={addTask}>
      <input
        value={newTaskTitle()}
        placeholder="What needs to be done?"
        onInput={(e) => setNewTaskTitle(e.currentTarget.value)}
      />
      <button>Add</button>
    </form>
  </Show>
  ...
</main>
```

::: warning Import Show
This code requires adding an import of `Show` from `solid-js`.
:::

And let's do the same for the `delete` button:

```tsx{15,17}
// src/components/Todo.tsx

return (
  <div>
    <input
      type="checkbox"
      checked={task.completed}
      oninput={(e) => setCompleted(e.target.checked)}
    />
    <input
      value={task.title}
      onInput={(e) => setTasks(i(), "title", e.target.value)}
    />
    <button onClick={saveTask}>Save</button>
    <Show when={taskRepo.metadata.apiDeleteAllowed()}>
      <button onClick={deleteTask}>Delete</button>
    </Show>
  </div>
```

This way we can keep the frontend consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values.
