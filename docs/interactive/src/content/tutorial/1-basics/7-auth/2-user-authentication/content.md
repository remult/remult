---
type: lesson
title: User Authentication
template: auth
focus: /shared/AuthController.ts
---

## User Authentication

In this lesson, we'll implement a basic sign-in mechanism using cookie session.

Let's add a `shared/AuthController.ts` file and include the following code:

```ts add={2-3,5-9}
import { BackendMethod, remult } from 'remult'
import type express from 'express'
import type from 'cookie-session'

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
const validUsers = [{ name: 'Jane' }, { name: 'Steve' }]

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
      throw Error("Invalid user, try 'Steve' or 'Jane'")
    }
  }
}
```

### Code Explanation

- We define a static list of valid users.
- The `signIn` method is decorated with `@BackendMethod({ allowed: true })`, making it accessible from the frontend.
- The method checks if the provided `name` exists in the `validUsers` list. If it does, it sets `remult.user` to an object that conforms to the `UserInfo` type from Remult and stores this user in the request session.
- If the user is not found, it throws an error.

Next, we'll add sign-out and current user methods:

```ts add={7-16}
export class AuthController {
  @BackendMethod({ allowed: true })
  static async signIn(name: string) {
    //...
  }

  @BackendMethod({ allowed: remult.authenticated })
  static async signOut() {
    remult.context.request!.session!['user'] = undefined
    return undefined
  }

  @BackendMethod({ allowed: true })
  static async currentUser() {
    return remult.user
  }
}
```

### Code Explanation

- The `signOut` method clears the user session, making the user unauthenticated.
- The `currentUser` method returns the current authenticated user.

Next, we'll adjust the `backend/index.ts` file:

```ts add={2-3,9-14,18-19}
import express from 'express'
import session from 'cookie-session'
import { AuthController } from '../shared/AuthController'

//...

export const app = express()

app.enable('trust proxy') // required for stackblitz and other reverse proxy scenarios
app.use(
  session({
    secret: process.env['SESSION_SECRET'] || 'my secret',
  }),
)

export const api = remultExpress({
  entities: [Task],
  controllers: [TasksController, AuthController],
  getUser: (request) => request.session?.['user'],
  //...
})
```

### Code Explanation

- We import `session` from `cookie-session` and `AuthController`.
- We enable `trust proxy` for reverse proxy scenarios like StackBlitz.
- We configure the `cookie-session` middleware with a secret.
- We register `AuthController` in the `controllers` array.
- We add `getUser: (request) => request.session?.['user']` to extract the user from the session.

### Frontend Authentication

In `frontend/Auth.tsx`, we'll call the `AuthController` to sign in, sign out, etc.

```ts add={3-7,11,15}
async function signIn(f: FormEvent<HTMLFormElement>) {
  f.preventDefault()
  try {
    setCurrentUser(await AuthController.signIn(name))
  } catch (error) {
    alert((error as ErrorInfo).message)
  }
}

async function signOut() {
  setCurrentUser(await AuthController.signOut())
}

useEffect(() => {
  AuthController.currentUser().then(setCurrentUser)
}, [])
```

### Code Explanation

- The `signIn` function calls `AuthController.signIn` and sets the current user if successful.
- The `signOut` function calls `AuthController.signOut` to clear the current user.
- The `useEffect` hook fetches the current user when the component mounts.

### Try It Out

Try signing in as `Steve` or `Jane` and verify that you can perform CRUD operations on tasks. Sign out and ensure that you can no longer access the tasks.
