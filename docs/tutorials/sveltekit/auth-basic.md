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
Our preferred authentication mechanism will require a username and password. Let's use Typescript's augmentation to extend Remault's interface to include these fields.

Create a new file `types/userinfo.d.ts` and add the following:

```ts
import { type UserInfo } from "remult";

declare module 'remult' {
  export interface UserInfo {
    username:string,
    password:string,
  }
}
```

Now `UserInfo` has 5 fields.

## Authentication Using _Basic Auth_
In this tutorial, we'll use HTTP Basic Auth ([RFC 7617](https://tools.ietf.org/html/rfc7617)) to authenticated users. Basic Auth is very, well... basic, as the credentials are merely encoded and not encrypted or hashed in any way. For this reason, basic authentication is typically used in conjunction with HTTPS (TLS) to provide confidentiality. 

In this tutorial we will not use HTTS. The goal here is to demonstrate how Remult handles authentication and authorization.

In a nutshell, Basic Auth works as follows:

1. The browser makes a request to the server
2. The server checks whether the request has an "Authorization" header which will obviously not be present the first time the request is received
3. The server returns a **401 Unauthorized** status and adds a `WWW-Authenticate: Basic realm="Some Name", charset="UTF-8"` header.
4. When the browser detects the special header, it presents a prompt for the user to enter a username and password.
5. The browser concatenates the username and password using a colon (`username:password`); encodes the result using `Base64`; sets the `Authorization` header to the encoded data preceeded by the `Basic` keyword (eg `Authorization: Basic c3RldmU6cEBzc3dvcmQ=`) and re-sends the request
6. The server decodes and verifies the credentials and returns the requested resource if successfull.
7. The browser caches the `Authorization` header and adds it to all subsequent requests.

To implement this logic, first install `@types/node` as a dev dependency (because of `Buffer`) by invoking `npm install @types/node -D`; then create a new file `src/hooks/handleBasicAuth.ts` with the following content:

```ts
// src/hooks/handleBasicAuth.ts

import type { Handle } from "@sveltejs/kit";
import type { UserInfo } from "remult";

const validUsers: UserInfo[] = [
  {id: "1", name:"Jane", username:"jane", password:"s3cr3t", roles:["admin"]},
  {id: "2", name:"Steve", username:"steve", password:"p@ssword", roles:[]},
]

export const handleBasicAuth: Handle = async ({ event, resolve }) => {
  const authResp = new Response("Not Authorized", {
    status: 401,
    headers:{ "WWW-Authenticate": 'Basic realm="Todo App", charset="UTF-8"'}
  });
  
  const authHeader = event.request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return authResp
  }

  const [username, password] = Buffer
    .from(authHeader.split(' ')[1], 'base64')
    .toString()
    .split(":");
  
  const user = validUsers.find(user => 
    (user.username === username) && (user.password === password)
  );

  if (!user) {
    return authResp
  }

  event.locals.user = user;

  return await resolve(event)
};
```
::: tip Propagating the UserInfo
After we have authenticated the user, we store the user information in `event.locals.user` such that it can be used inside of other **server** load functions and **server-side** hooks.
:::

::: tip Securing User Information
In a more realistic setup, the list of users will most likely reside in a properly secured database or PAAS
:::

We now need to add `handleBasicAuth` in the middleware sequence **BEFORE** `handleRemult` middleware; so that it is invoked first. Update your `hooks.server.ts`:

```ts
import { sequence } from "@sveltejs/kit/hooks";
import { handleRemult } from "./hooks/handleRemult";
import { handleBasicAuth } from "./hooks/handleBasicAuth";

export const handle = sequence(handleBasicAuth, handleRemult);
```

Restart the dev server and try to access the tasks list. You will be prompted to enter your username and password. Log in as _steve_ with _p@ssword_. You will then be able to add, edit and delete tasks just like before.

### Displaying User Info on the Frontend
To display the logged-in user's name in our template, we need to get the user details from `event.locals`. We cannot access `locals` directly in our `+page.svelte` since it is only available server-side. We can however access it from the `load` function inside `+page.server.ts` and send it to the front-end as part of `PageData` -- stripping away sensitive information in the process.

To accomplish this, edit the `load` function inside `+page.server.ts`:

```ts
// +page.server.ts

export const load = async ({ url, locals }) => {
  // ...
  const user = locals?.user;

  return {
      tasks: structuredClone(tasks),
      options,
      user: JSON.stringify(user, ["name", "id", "username"])
  };
};
```
::: tip
Notice that in addition to `url`, we are also destructuring the `locals` from the `ServerLoadEvent`.
:::

Now the user's name, id and username are available in the front-end. Modify `+page.svelte` to display the name:

```svelte
<script lang="ts">
  //...

  export let data;
  export let form;
  const user = JSON.parse(data.user); //<== 

  // ...
</script>

<!-- ... -->

<div>
  <h1>todos</h1>
  <main>
    <div><h3>Welcome {user.name},</h3></div>

    <!-- ... -->

  </main>
</div>
```

## Authorization

Even though Sveltekit is handing authentication we have not yet linked the authentication to Remult. We need to tie them together, by informing Remult how to get the details of the logged in user.

Edit `hooks/handleRemult.ts` and configure the `getUser` property:

```ts
// hooks/handleRemult.ts

import { remultSveltekit } from "remult/remult-sveltekit";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";
import type { UserInfo } from "remult";

export const handleRemult = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) => (await event?.locals?.user) as UserInfo
});
```

::: tip
We are instructing Remult to use the `user` information that was saved in the `event.locals` inside of the `handleBasicAuth.ts` hook.
:::

Remult keeps all authorization rules within the entities - essentially making the entity the single source of truth. Currently the rule `allowApiCrud: true` allows all users to perform CRUD operations. 

Let's change the rules within the `Task` `@Entity` decorator such that only authenticated users can perform CRUD operations; also, only the "admins" can view the tasks - by adding a new `allowApiRead` property:

```ts
// src/shared.Task.ts
@Entity("tasks", {
    allowApiCrud: Allow.authenticated,
    allowApiRead: "admin"
})
```

::: warning Import Allow
This code requires adding an import of `Allow` from `remult`. You may also need to restart the dev server.
:::

After the browser refreshes, **the list of tasks disappears**!! This is because user "steve" does not have the "admin" role, yet `allowApiRead: "admin"` limits "READ"-ing to admins only.

Basic Auth does not have a well defined method of logging out a user. To log in as a different user, you will need to exit the browser; open a new window and log in again with different credentials. For testing purposes it would be easier to use a command-line tool, or an API tool such as _Postman_, _Insomnia_ or _Thunder Client_. 

Log in again - this time using "jane" with password "s3cr3t". Jane can view all the tasks. Let's modify the entity so that all authenticated users can at least view all the tasks, but only admins to be able to create, edit and delete tasks:


::: danger Authorized server-side code can still modify tasks

Although client CRUD requests to `tasks` API endpoints now require a signed-in user, the API endpoint created for our `setAllCompleted` server function remains available to unauthenticated requests. Since the `allowApiCrud` rule we implemented does not affect the server-side code's ability to use the `Task` entity class for performing database CRUD operations, **the `setAllCompleted` function still works as before**.

To fix this, let's implement the same rule using the `@BackendMethod` decorator of the `setAllCompleted` method of `TasksController`.

```ts
// src/shared/TasksController.ts

@BackendMethod({ allowed: Allow.authenticated })
```

**This code requires adding an import of `Allow` from `remult`.**
:::

## Field-Level Authorization

Besides defining authorization rules at the Entity level, Remult also allows you to define fine-grained rules at the field level inside the `@Fields` decorator. Here below, we allow only the "admins" to be able to update the "title" column.

```ts
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

## Role-based Authorization on the Frontend

The authorization rules defined in the Entity are also exposed from the repository's `metadata` property and can therefore be used in the Frontend.

From the end-user's perspective it only makes sense that users that can't add or delete, would not see these buttons.

Let's reuse the same definitions on the Frontend to only show the form if the user is allowed to insert

```svelte
// src/routes/+page.svelte

// ...

{#if taskRepo.metadata.apiInsertAllowed()}
  <form method="POST" action="?/addTask" use:enhance>
    <input name="newTaskTitle" placeholder="What needs to be done?" />
    <button>Add</button>
  </form>
{/if}

// ...

{#each tasks as task (task.id)}
  <div>
    <input type="checkbox" 
      bind:checked={task.completed} 
      on:change="{() => saveTask(task)}"
    />
    <input type="text" bind:value={ task.title } />
    <button on:click="{() => saveTask(task)}">Save</button>

    {#if taskRepo.metadata.apiDeleteAllowed()}
      <form method="POST" action="?/deleteTask" use:enhance>
        <input name="id" type="hidden" value="{task.id}" />
        <button>Delete</button>
      </form>
    {/if}
    
  </div>
{/each}

// ...
```

This way we can keep the frontend consistent with the `api`'s Authorization rules

- Note We send the `task` to the `apiDeleteAllowed` method, because the `apiDeleteAllowed` option, can be sophisticated and can also be based on the specific item's values.
