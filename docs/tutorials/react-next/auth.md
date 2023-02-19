# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use [NextAuth.js](https://next-auth.js.org/) for authentication.

## Tasks CRUD Requires Sign-in

This rule is implemented within the `Task` `@Entity` decorator, by modifying the value of the `allowApiCrud` property.
This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

_src/shared/Task.ts_

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
curl -i http://localhost:3000/api/tasks
```

:::

::: danger Authorized server-side code can still modify tasks
Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAllCompleted` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAllCompleted` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAllCompleted` method of `TasksController`.

_src/shared/TasksController.ts_

```ts
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

2. `NextAuth` requires a "secret" used to encrypt the NextAuth.js JWT.

   Create a file called `.env.local` and set the `NEXTAUTH_SECRET` to a random string.

   _.env.local_

   ```
   NEXTAUTH_SECRET=something-secret
   ```

   :::tip
   you can use an [online UUID generator](https://www.uuidgenerator.net/) to generate a completely random string
   :::

3. In the `src/pages/api` folder, create a folder called `auth` and Create the following `[...nextauth].ts` file in it (API route).

   _src/pages/api/auth/[...nextauth].ts_

   ```ts
   import NextAuth from "next-auth/next"
   import Credentials from "next-auth/providers/credentials"
   import { UserInfo } from "remult"

   const validUsers: UserInfo[] = [
     { id: "1", name: "Jane" },
     { id: "2", name: "Steve" }
   ]

   export default NextAuth({
     providers: [
       Credentials({
         credentials: {
           name: {
             placeholder: "Try Steve or Jane"
           }
         },
         authorize: info =>
           validUsers.find(user => user.name === info?.name) || null
       })
     ]
   })
   ```

   This (very) simplistic NextAuth.js [Credentials](https://next-auth.js.org/providers/credentials) authorizes users by looking up the user's name in a predefined list of valid users.

### Frontend setup

Add the highlighted code to the `_app.tsx` Next.js page:

_src/pages/\_app.tsx_

```tsx{3,7,9}
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

```

Replace the `useEffect` with the highlighted code to the `Home` Next.js page:

_src/pages/index.tsx_

```tsx{1,3,6-7,15-16,21-24}
import { signIn, signOut, useSession } from "next-auth/react"
//...
const session = useSession()

useEffect(() => {
  if (session.status === "unauthenticated") signIn()
  else if (session.status === "authenticated")
    return taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { completed: "asc" }
        //where: { completed: true },
      })
      .subscribe(info => setTasks(info.applyChanges))
}, [session])
if (session.status !== "authenticated") return <></>
return (
  <div>
    <h1>Todos</h1>
    <main>
      <div>
        Hello {session.data?.user?.name}
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
      ...
    </main>
  </div>
)
```

### Connect Remult-Next On the Backend

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that extracts a `UserInfo` object from a `Request`.

1. Add the following `findUserById` function to `[...nextauth].ts`.

_src/pages/api/auth/[...nextauth].ts_

```ts
export function findUserById(id?: string) {
  return validUsers.find(user => user.id === id)
}
```

- Note that we've made the `id` parameter optional to support cases where the id is undefined, in such cases it'll return an undefined user

2. Set the `getUser` property of the options object of `remultNext` to a function that gets the token from next auth and users `findUserById` to get the actual user:

   _src/pages/api/[...remult].ts_

```ts{1-2,5}
import { findUserById } from "./auth/[...nextauth]"
import { getToken } from "next-auth/jwt"

export default remultNext({
  getUser: async req => findUserById((await getToken({ req }))?.sub)
  //...
})
```

The todo app now supports signing in and out, with **all access restricted to signed in users only**.

## Role-based Authorization

Usually, not all application users have the same privileges. Let's define an `admin` role for our todo app, and enforce the following authorization rules:

- All signed in users can see the list of tasks.
- All signed in users can set specific tasks as `completed`.
- Only users belonging to the `admin` role can create, delete or edit the titles of tasks.

1. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

_src/shared/Task.ts_

```ts{5-6,16}
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

_pages/api/auth/[...nextauth].ts_

```ts{2}
const validUsers = [
  { id: "1", name: "Jane", roles: ["admin"] },
  { id: "2", name: "Steve", roles: [] }
]
```

**Sign in to the app as _"Steve"_ to test that the actions restricted to `admin` users are not allowed. :lock:**

## Role-based Authorization on the Frontend

From a user experience perspective in only makes sense that uses that can't add or delete, would not see these buttons.

Let's reuse the same definitions on the Frontend.

### Connect Remult-Next On the Frontend

First we need to configure `next-auth` to include the user info in the `session` info provided to the frontend

Apply these changes to the code of `[...nextauth].ts` file

_pages/api/auth/[...nextauth].ts_

```ts{2-7}
export default NextAuth({
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: findUserById(token?.sub)
    })
  }
  //...
})
```

Next let's set remult's user based on the `session` info

```ts{2}
useEffect(() => {
  remult.user = session.data?.user as UserInfo
  if (session.status === "unauthenticated") signIn()
  else if (session.status === "authenticated")
    return taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { completed: "asc" }
        //where: { completed: true },
      })
      .subscribe(info => setTasks(info.applyChanges))
}, [session])
```

::: warning Import UserInfo
This code requires adding an import of `UserInfo` from `remult`.
:::

## Show functionality based on the entity's metadata

Now let's use the entity's metadata to only show the form if the user is allowed to insert

_src/pages/index.tsx_

```tsx{2,11}
<main>
  {taskRepo.metadata.apiInsertAllowed && (
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

_src/pages/index.tsx_

```tsx{10,12}
return (
  <div key={task.id}>
    <input
      type="checkbox"
      checked={task.completed}
      onChange={e => setCompleted(e.target.checked)}
    />
    <input value={task.title} onChange={e => setTitle(e.target.value)} />
    <button onClick={saveTask}>Save</button>
    {taskRepo.metadata.apiDeleteAllowed && (
      <button onClick={deleteTask}>Delete</button>
    )}
  </div>
)
```

This way we can keep the frontend consistent with the `api`'s Authorization rules
