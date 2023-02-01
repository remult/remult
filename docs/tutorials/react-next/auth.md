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

2. In the `src/pages/api` folder, create a folder called `auth` and Create the following `[...nextauth].ts` file in it (API route).

   _src/pages/api/auth/[...nextauth].ts_

   ```ts
   import NextAuth from "next-auth/next"
   import CredentialsProvider from "next-auth/providers/credentials"
   import { UserInfo } from "remult"

   const secret = process.env["NEXTAUTH_SECRET"] || "my secret"

   const validUsers: UserInfo[] = [
     { id: "1", name: "Jane" },
     { id: "2", name: "Steve" }
   ]

   export default NextAuth({
     providers: [
       CredentialsProvider({
         name: "Username",
         credentials: {
           name: {
             label: "Username",
             type: "text",
             placeholder: "Try Steve or Jane"
           }
         },
         authorize: credentials =>
           validUsers.find(user => user.name === credentials?.name) || null
       })
     ],
     secret
   })
   ```

   This (very) simplistic NextAuth.js [CredentialsProvider](https://next-auth.js.org/providers/credentials) authorizes users by looking up a `username` in a predefined list of valid users.

### Frontend setup

Add the highlighted code to the `_app.tsx` Next.js page:

_src/pages/\_app.tsx_

```tsx{3,5-15}
import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { SessionProvider } from "next-auth/react"

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
```

Add the highlighted code to the `Home` Next.js page:

_src/pages/index.tsx_

```tsx{2,7,11-25,31-39}
//... imports
import { signIn, signOut, useSession } from "next-auth/react"

//... fetchTasks

export default function Home() {
  const { data: session } = useSession()

  //,,,

  if (!session) {
    return (
      <div>
        <div className="flex items-center justify-center h-screen bg-gray-50 text-lg flex-col">
          <h3 className="text-6xl text-red-500 italic">Todos</h3>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-base text-white font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline mt-8"
            onClick={() => signIn()}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 text-lg flex-col">
      <h3 className="text-6xl text-red-500 italic">Todos</h3>
      <main className="bg-white border rounded-lg  shadow-lg flex flex-col w-screen m-5 max-w-md">
        <div className="flex  justify-between px-6 p-2">
          Hello {session.user!.name}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-base text-white font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => signOut()}
          >
            Sign Out
          </button>
        </div>
        <form onSubmit={addTask} className="border-b-2 p-2 px-6 flex"></form>
        ...
      </main>
    </div>
  )
}
```

### Connect Remult-Next

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that extracts a `UserInfo` object from a `Request`.

1. Add the following `getUserFromNextAuth` function to `[...nextauth].ts`.

_src/pages/api/auth/[...nextauth].ts_

```ts
export async function getUserFromNextAuth(req: NextApiRequest) {
  const token = await getToken({ req, secret })
  return validUsers.find(u => u.id === token?.sub)
}
```

::: warning Import NextApiRequest and getToken
This code requires adding an import of `NextApiRequest` from `next` and `getToken` from `next-auth-jwt`.
:::

2. Set the `getUser` property of the options object of `remultNext` to the `getUserFromNextAuth` function:

   _src/pages/api/[...remult].ts_

```ts{1,7}
import { getUserFromNextAuth } from "../pages/api/auth/[...nextauth]"

//...

export const api = remultNext({
  //...
  getUser: getUserFromNextAuth
})
```

The todo app now supports signing in and out, with **all access restricted to signed in users only**.

## Role-based Authorization

Usually, not all application users have the same privileges. Let's define an `admin` role for our todo app, and enforce the following authorization rules:

- All signed in users can see the list of tasks.
- All signed in users can set specific tasks as `completed`.
- Only users belonging to the `admin` role can create, delete or edit the titles of tasks.
- Only users belonging to the `admin` role can mark all tasks as completed or uncompleted.

1. Create a `roles.ts` file in the `src/shared/` folder, with the following `Roles`:

_src/shared/Roles.ts_

```ts
export const Roles = {
  admin: "admin"
}
```

2. Modify the highlighted lines in the `Task` entity class to reflect the top three authorization rules.

_src/shared/Task.ts_

```ts{2,5-8,16}
import { Allow, Entity, Fields, Validators } from "remult"
import { Roles } from "./Roles"

@Entity<Task>("tasks", {
  allowApiRead: Allow.authenticated,
  allowApiUpdate: Allow.authenticated,
  allowApiInsert: Roles.admin,
  allowApiDelete: Roles.admin
})
export class Task {
  @Fields.uuid()
  id!: string

  @Fields.string({
    validate: Validators.required,
    allowApiUpdate: Roles.admin
  })
  title = ""

  @Fields.boolean()
  completed = false
}
```

3. Modify the highlighted line in the `TasksController` class to reflect the fourth authorization rule.

_src/shared/TasksController.ts_

```ts{3,6}
import { Allow, BackendMethod, remult } from "remult"
import { Task } from "./Task"
import { Roles } from "./Roles"

export class TasksController {
  @BackendMethod({ allowed: Roles.admin })
  static async setAll(completed: boolean) {
    const taskRepo = remult.repo(Task)

    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
}
```

4. Let's give the user _"Jane"_ the `admin` role by modifying the `roles` array of her `validUsers` entry.

_pages/api/auth/[...nextauth].ts_

```ts{2}
const validUsers = [
  { id: "1", name: "Jane", roles: [Roles.admin] },
  { id: "2", name: "Steve", roles: [] }
]
```

::: warning Import Roles
This code requires adding an import of `Roles` from `./Roles`.
:::

**Sign in to the app as _"Steve"_ to test that the actions restricted to `admin` users are not allowed. :lock:**

//TODO - remove Roles
//TODO - try to make next-auth give sensible session info.
//TODO - vercel deployment
//TODO - consider remult.authenticated instead of Allow.authenticated
