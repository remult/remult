# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use [NextAuth.js](https://next-auth.js.org/) for authentication.

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

Let's set-up `NextAuth.js` to authenticate users to our app.

### Backend setup

1. Install `next-auth`:

   ```sh
   npm i next-auth
   ```

2. `NextAuth` requires a "secret" used to encrypt the NextAuth.js JWT, see [Options | NextAuth.js](https://next-auth.js.org/configuration/options#nextauth_secret) for more info.

   Create a file called `.env.local` and set the `NEXTAUTH_SECRET` to a random string.

   ```
   // .env.local

   NEXTAUTH_SECRET=something-secret
   ```

   :::tip
   you can use an [online UUID generator](https://www.uuidgenerator.net/) to generate a completely random string
   :::

3. Create an `auth` folder within the 'api' folder, and inside it, create a `[...nextauth]` subdirectory. Inside the `app/api/auth/[...nextauth]` directory, craft an `auth.ts` file with the following code.

   ```ts
   // src/auth.ts

   import NextAuth, { getServerSession } from 'next-auth/next'
   import Credentials from 'next-auth/providers/credentials'
   import { UserInfo } from 'remult'

   const validUsers: UserInfo[] = [
     { id: '1', name: 'Jane' },
     { id: '2', name: 'Steve' },
   ]
   function findUser(name?: string | null) {
     return validUsers.find((user) => user.name === name)
   }

   export const auth = NextAuth({
     providers: [
       Credentials({
         credentials: {
           name: {
             placeholder: 'Try Steve or Jane',
           },
         },
         authorize: (credentials) => findUser(credentials?.name) || null,
       }),
     ],
     callbacks: {
       session: ({ session }) => ({
         ...session,
         user: findUser(session.user?.name),
       }),
     },
   })

   export async function getUserOnServer() {
     const session = await getServerSession()
     return findUser(session?.user?.name)
   }
   ```

   This (very) simplistic NextAuth.js [Credentials](https://next-auth.js.org/providers/credentials) authorizes users by looking up the user's name in a predefined list of valid users.

   We've configured the `session` `callback` to include the user info as part of the session info, so that remult on the frontend will have the authorization info.

4. Create an `auth` folder within the 'api' folder, and inside it, create a `[...nextauth]` subdirectory. Inside the `app/api/auth/[...nextauth]` directory, craft a `route.ts` file with the following code.

   ```ts
   // src/app/api/auth/[...nextauth]/route.ts

   import type { auth } from '../../../../auth'

   export { auth as GET, auth as POST }
   ```

### Frontend setup

1. Create a `src/components/auth.tsx` file, and place the following code to it:

   ```tsx
   // src/components/auth.tsx

   import { signIn, signOut, useSession } from 'next-auth/react'
   import { useEffect } from 'react'
   import { UserInfo, remult } from 'remult'
   import Todo from './todo'

   export default function Auth() {
     const session = useSession()
     remult.user = session.data?.user as UserInfo

     useEffect(() => {
       if (session.status === 'unauthenticated') signIn()
     }, [session])
     if (session.status !== 'authenticated') return <></>
     return (
       <div>
         Hello {remult.user?.name}{' '}
         <button onClick={() => signOut()}>Sign Out</button>
         <Todo />
       </div>
     )
   }
   ```

2. Update the `src/app/page.tsx` with the highlighted changes:

   ```tsx{3-5,9-11}
   // src/app/page.tsx

   "use client"
   import { SessionProvider } from "next-auth/react"
   import Auth from "../components/auth"

   export default function Home() {
     return (
       <SessionProvider>
         <Auth />
       </SessionProvider>
     )
   }
   ```

### Connect Remult-Next On the Backend

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that uses the `getUserOnServer` function we've created in `src/auth.ts`

```ts{3,7}
// src/api.ts

import { getUserOnServer } from "./auth"

const api = remultNextApp({
  //...
  getUser: getUserOnServer,
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
// src/components/todo.tsx

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
// src/components/todo.tsx

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
