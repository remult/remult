# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism, and only required to provide Remult with an object which implements the Remult `UserInfo` interface.

In this tutorial, we'll use [NextAuth.js](https://next-auth.js.org/) for authentication. 

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
curl -i http://localhost:3000/api/tasks
```
:::

::: tip Use authorization metadata to avoid redundant api requests
Although not necessary, it's a good idea to avoid sending `GET` api requests for tasks from our React app, if the current user is not authorized to access the endpoint.

A simple way to achieve this is by adding the highlighted code lines to the `fetchTasks` function in `home/index.tsx`:

*pages/index.tsx*
```ts{2-3}
async function fetchTasks(hideCompleted: boolean) {
   if (!taskRepo.metadata.apiReadAllowed)
      return [];
   return taskRepo.find({
      limit: 20,
      orderBy: { completed: "asc" },
      where: { completed: hideCompleted ? false : undefined }
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
**This code requires adding an import of `Allow` from `remult`.**
:::

## User Authentication
Let's set-up `NextAuth.js` to authenticate users to our app.

### Backend setup

1. Install `next-auth`:
   
```sh
npm i next-auth
```

2. Create the following `[...nextauth].ts` API route. 

    *pages/api/auth/[...nextauth].ts*
    ```ts
    import NextAuth from "next-auth"
    import CredentialsProvider from "next-auth/providers/credentials"

    const validUsers = [
        { id: "1", name: "Jane", roles: ["admin"] },
        { id: "2", name: "Steve", roles: [] },
    ];

    const secret = process.env['NEXTAUTH_SECRET'] || "my secret";

    export default NextAuth({
        providers: [
            CredentialsProvider({
                name: "Username",
                credentials: {
                    name: { label: "", type: "text", placeholder: "Username, try Steve or Jane" },
                },
                authorize(credentials) {
                    return validUsers.find((user) => user.name === credentials?.name) || null;
                },
            })],
        secret: secret
    })
    ```

    This (very) simplistic NextAuth.js [CredentialsProvider](https://next-auth.js.org/providers/credentials) authorizes users by looking up a `username` in a predefined list of valid users. 

### Frontend setup

Add the highlighted code to the `Home` Next.js page:

*pages/index.tsx*
```tsx{2,7,13-22}
//... imports
import { signIn, signOut, useSession } from "next-auth/react";

//... fetchTasks

const Home: NextPage = () => {
  const { data: session } = useSession();

  //,,,

  return (
    <div>
      <header>
        {session
          ? (
            <>
              Hello {session?.user?.name}{" "}
              <button onClick={() => signOut()}>Sign Out</button>
            </>
          )
          : <button onClick={() => signIn()}>Sign In</button>}
      </header>
      
      <main>
      //...
      </main>
    </div>
  )
}
```

### Connect Remult middleware

Once an authentication flow is established, integrating it with Remult in the backend is as simple as providing Remult with a `getUser` function that extracts a `UserInfo` object from a `Request`.

1. Add the following `getUserFromNextAuth` function to `[...nextauth].ts`.

*pages/api/auth/[...nextauth].ts*
```ts
export async function getUserFromNextAuth(req: NextApiRequest) {
    const token = await getToken({ req, secret }); // import getToken from 'next-auth/jwt'
    return validUsers.find(u => u.id === token?.sub);
}
```

2. Set the `getUser` property of the options object of `createRemultServer` to the `getUserFromNextAuth` function:

  *src/server/api.ts*
  ```ts{5}
  //...

  export const api = createRemultServer({
      //...
      getUser: getUserFromNextAuth
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

4. Let's give the user *"Jane"* the `admin` role by modifying the `roles` array of her `validUsers` entry.

*pages/api/auth/[...nextauth].ts*
```ts{2}
const validUsers = [
      { id: "1", name: "Jane", roles: [Roles.admin] },
      { id: "2", name: "Steve", roles: [] }
];
```

**Sign in to the app as *"Steve"* to test that the actions restricted to `admin` users are not allowed. :lock:**