# Authentication and Authorization

Our todo app is nearly functionally complete, but it still doesn't fulfill a very basic requirement - that users should log in before they can view, create or modify tasks.

Remult provides a flexible mechanism that enables placing **code-based authorization rules** at various levels of the application's API. To maintain high code cohesion, **entity and field-level authorization code should be placed in entity classes**.

**Remult is completely unopinionated when it comes to user authentication.** You are free to use any kind of authentication mechanism. The only requirement is that you provide Remult with an object which implements the Remult `UserInfo` interface:

```ts
export interface UserInfo {
  id: string
  name?: string
  roles?: string[]
}
```

In this tutorial, we'll use [Auth.js](https://authjs.dev/) for authentication.

## Tasks CRUD Requires Sign-in

This rule is implemented within the `Task` `@Entity` decorator, by modifying the value of the `allowApiCrud` property. This property can be set to a function that accepts a `Remult` argument and returns a `boolean` value. Let's use the `Allow.authenticated` function from Remult.

::: code-group

```ts [src/app/shared/Task.ts]
import { Allow } from 'remult'// [!code ++]

@Entity("tasks", {
    allowApiCrud: Allow.authenticated // [!code ++]
})
```

After the browser refreshes, **the list of tasks disappears** and the user can no longer create new tasks.

::: details Inspect the HTTP error returned by the API using cURL

```sh
curl -i http://localhost:5173/api/tasks
```

:::

### Server-side Authorization

Open your database (`db/tasks.json`), and click on **Mark All Completed** and **Mark All Incomplete** buttons in turn. You will notice that the `completed` field is toggling.

Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAllCompleted` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAllCompleted` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAllCompleted` method of `TasksController`.

::: code-group

```ts [src/shared/TasksController.ts]
import { Allow } from 'remult'

@BackendMethod({ allowed: Allow.authenticated })
```

:::

Try toggling the `completed` field and you will notice that we now require to be authenticated - even on the backend.

## User Authentication

Let's set-up `Auth.js` to authenticate users to our app.

### Backend setup

1. Install `auth-core` and `auth-sveltekit`:

   ```sh
   npm i @auth/core @auth/sveltekit -D
   ```

2. `Auth.js` requires a "secret" - a random string used to hash tokens, sign cookies and generate cryptographic keys.

Create a file called `.env.local` at the root of the project, and set the secret `AUTH_SECRET` to a random string.

::: code-group

```bash [.env.local]
AUTH_SECRET=something-secret
```

:::tip
You can use an [online UUID generator](https://www.uuidgenerator.net/) to generate a completely random string
:::

3. In `+hooks.server.ts`, let's create two handles

- `handleAuth` to handle authentication from `Auth.js` with a list of allowed users.
- `handleRemult` to provide the remult context.

Using Sveltekit's `sequence`, we ensure the chain of handles. The results would look like this:

::: code-group

```ts [src/hooks.server.ts]
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { SvelteKitAuth } from '@auth/sveltekit'
import Credentials from '@auth/sveltekit/providers/credentials'
import { api as handleRemult } from './server/api'
import type { UserInfo } from 'remult'

/**
 * Users that are allowed to log in.
 */
const validUsers: UserInfo[] = [
  { id: '1', name: 'Jane', roles: ['admin'] },
  { id: '2', name: 'Steve' },
]

/**
 * Handle authentication with authjs as an example
 * Based on article at https://authjs.dev/reference/sveltekit
 */
export const { handle: handleAuth } = SvelteKitAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        name: {
          placeholder: 'Try Steve or Jane',
        },
      },
      authorize: (info) =>
        validUsers.find((user) => user.name === info?.name) || null,
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: validUsers.find((user) => user.id === token?.sub),
    }),
  },
})

export const handle = sequence(
  // 1. Handle authentication
  handleAuth,
  // 2. Handle remult server side
  handleRemult,
)
```

:::

This (very) simplistic approach use Auth.js [Credentials Provider](https://next-auth.js.org/providers/credentials) to authorize users by looking up the user's name in a predefined list of valid users.

We've configured the `session` `callback` to include the user info as part of the session data, so that Remult on the frontend will have the authorization info.

4. Finally, add `getUser` to `remultApi` to tell remult who is connected. Inside this function, you have access to `event`, where the session was set by Auth.js before.

::: code-group

```ts [src/server/api.ts]
import { remultApi } from 'remult/remult-sveltekit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import type { UserInfo } from 'remult' // [!code ++]

export const api = remultApi({
  admin: true,
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) => {
    const auth = await event?.locals?.auth() // [!code ++]
    return auth?.user as UserInfo // [!code ++]
  },
})
```

:::

### Frontend setup

1. Create a new `+layout.server.ts` to update `remult.user`

::: code-group

```ts [src/routes/+layout.server.ts]
import { remult } from 'remult'
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

// will protect every route in the app
export const load = (async () => {
  if (!remult.authenticated()) {
    throw redirect(303, '/auth/signin')
  }
  return {
    user: remult.user,
  }
}) satisfies LayoutServerLoad
```

:::

2. In our front-end (`+layout.svelte`), update the user globally.

::: code-group

```svelte [src/routes/+layout.ts]
<script lang="ts">
  import { remult } from "remult";// [!code ++]
  import "../app.css"

  interface Props {
    data: import('./$types').LayoutData;
    children?: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();

  $effect(() => {// [!code ++]
    remult.user = data.user;// [!code ++]
  });// [!code ++]
</script>

<svelte:head>
  <title>Remult+Sveltekit Todo App</title>
</svelte:head>

{@render children?.()}
```

:::

The todo app now supports signing in and out, with **all access restricted to signed in users only**.

## Role-based Authorization

Usually, not all application users have the same privileges. You will notice that our `UserInfo` contains a `roles` array. Information contained in this array can be used to enforce role-based authorization.

For our todo app we need to enforce the following authorization rules:

- All signed in users can see the list of tasks.
- All signed in users can set specific tasks as `completed`.
- Only users belonging to the `admin` role can create, delete or edit the titles of tasks.

1. Modify the highlighted lines in the `Task` entity class to enforce the three authorization rules above.

::: code-group

```ts [src/shared/Task.ts]
import { Allow, Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string<Task>({
    validate: (task) => {
      if (task.title.length < 3)
        throw 'The title must be at least 3 characters long'
    },
    allowApiUpdate: 'admin',
  })
  title: string = ''

  @Fields.boolean()
  completed: boolean = false

  @Fields.createdAt()
  completedAt: Date = new Date()
}
```

:::

In our list of users - `usersDB`; we have defined two users - Jane and Steve; with Jane being assigned an `admin` role.

**Sign in to the app alternating between _"Jane"_ and _"Steve"_ to test that the actions restricted to `admin` users are not allowed. :lock:**

## Role-based Authorization on the Frontend

From a user experience perspective it only makes sense that users that can't add or delete, would not see these buttons.

Let's reuse the same definitions on the Frontend.

We'll use the entity's metadata to only show the form if the user is allowed to insert

::: code-group

```svelte [src/routes/+page.svelte]

<main>
  {#if repo(Task).metadata.apiInsertAllowed()}// [!code ++]
    <form onsubmit={addTask}>
      <input bind:value={newTaskTitle} placeholder="What needs to be done?" />
      <button>Add</button>
    </form>
  {/if}// [!code ++]
</main>
```

:::

And let's do the same for the `delete` button:

::: code-group

```svelte [src/routes/+page.svelte]
<div>
  <input
    type="checkbox"
    checked={task.completed}
    oninput={(e) => setCompleted(task, e.currentTarget.checked)}
  />
  <!-- <span>{task.title}</span> -->
  <input name="title" bind:value={task.title} />
  <button onclick={(e) => saveTask(e, task)}>Save</button>
  {#if repo(Task).metadata.apiDeleteAllowed(task)} // [!code ++]
    <button onclick={(e) => deleteTask(e, task)}>Delete</button>
  {/if}// [!code ++]
</div>
```

:::

This way we can keep the UI consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values.
