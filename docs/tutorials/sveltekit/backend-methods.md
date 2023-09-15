# Backend methods

When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

## Set All Tasks as Un/completed

Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAllCompleted` async function to `+page.svelte` function component, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

   ```ts
   // src/routes/+page.svelte

   async function setAllCompleted(completed: boolean) {
     for (const task of await taskRepo.find()) {
       await taskRepo.save({ ...task, completed })
     }
   }
   ```

   The `for` loop iterates the array of `Task` objects returned from the backend, and saves each task back to the backend with a modified value in the `completed` field.

2. Add the two buttons to the end of the `</main>` section of the component. Both of the buttons' `on:click` events will call the `setAllCompleted` function with the appropriate value of the `completed` argument.

```svelte
// src/routes/+page.svelte

<div>
  <button on:click={() => setAllCompleted(true)}>Mark All Completed</button>
  <button on:click={() => setAllCompleted(false)}>Mark All Incomplete</button>
</div>
   ```

Make sure the buttons are working as expected before moving on to the next step.

## Refactor from Front-end to Back-end

With the current state of the `setAllCompleted` function, each modified task being saved causes an API `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue. You can verify this on the Network tab of your browser's Developer Tools.

A simple way to prevent this is to expose an API endpoint for `setAllCompleted` requests, and run the same logic on the server instead of the client.

1. Create a new `TasksController` class, in the `shared` folder, and refactor the `for` loop from the `setAllCompleted` function of the `+page.svelte` into a new, `static`, `setAllCompleted` method in the `TasksController` class, which will run on the server.

```ts
// src/shared/TasksController.ts

import { BackendMethod, remult } from "remult"
import { Task } from "./Task"

export class TasksController {
  @BackendMethod({ allowed: true })
  static async setAllCompleted(completed: boolean) {
    const taskRepo = remult.repo(Task)

    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
}
```

The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (the `allowed` property will be discussed later on in this tutorial).

**Unlike the front-end `Remult` object, the server implementation interacts directly with the database.**

2. Register the new `TasksController` class by adding it to the `controllers` array of the `options` object passed to `remultSveltekit()`, in the server's `hooks.server.ts` file:

```ts
// src/server/api.ts

import { remultSveltekit } from "remult/remult-sveltekit";
import { Task } from "./shared/Task";
import { TasksController } from "./shared/TasksController";

export const handle = remultSveltekit({
    entities: [Task],
    controllers: [TasksController]
});
```

3. Replace the `for` iteration in the `setAllCompleted` function in `+page.svelte` with a call to the `setAllCompleted` method in the `TasksController`.

```ts
// src/routes/+page.svelte

async function setAllCompleted(completed: boolean) {
  await TasksController.setAllCompleted(completed)
}
```

::: warning Import TasksController
Remember to add an import of `TasksController` in `+page.svelte`.
:::

::: tip Note
With Remult backend methods, argument types are compile-time checked. :thumbsup:
:::

After the browser refreshed, the _"Set all..."_ buttons function exactly the same, but are much faster. You can verify in the Developer Tools that only one event is fired.
