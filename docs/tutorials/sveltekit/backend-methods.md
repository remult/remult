# Backend methods

When performing operations on multiple entity objects, performance considerations may necessitate running them on the server. **With Remult, moving client-side logic to run on the server is a simple refactoring**.

## Set All Tasks as Un/completed

Let's add two buttons to the todo app: "Set all as completed" and "Set all as uncompleted".

1. Add a `setAllCompleted` async function to `+page.svelte` function component, which accepts a `completed` boolean argument and sets the value of the `completed` field of all the tasks accordingly.

```ts
// src/routes/+page.svelte
<script lang="ts">
  // ...

  async function setAllCompleted(completed: boolean) {
    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
</script>
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

With the current state of the `setAllCompleted` function, each modified task being saved pushes a `PUT` request handled separately by the server. As the number of tasks in the todo list grows, this may become a performance issue. You can verify this on the Network tab of your browser's Developer Tools.

### Refactor #1: Using Form Actions
A simple way to prevent this is in Sveltekit is to use Form actions like we have done.

1. To accomplish this, we will create two actions `setAllComplete` and `setAllIncomplete` in `+page.server.ts`:

```ts
// src/routes/+page.server.ts

import { remult, type FindOptions } from 'remult';
import { Task } from '../shared/Task';
import { fail } from '@sveltejs/kit';

const taskRepo = remult.repo(Task);

export const load = async ({ url }) => {
  // ... 
}

export const actions = {
	// ...

	setAllComplete: async ({ request }) => {
		try {
			for (const task of await taskRepo.find()) {
				await taskRepo.update(task.id, { completed: true });
			}

			return {
				success: true,
				message: 'All tasks are completed'
			};
		} catch (error) {
			return fail(400, { error: (error as { message: string }).message });
		}
	},

	setAllInComplete: async ({ request }) => {
		try {
			for (const task of await taskRepo.find()) {
				await taskRepo.update(task.id, { completed: false });
			}

			return {
				success: true,
				message: 'All tasks are inomplete'
			};
		} catch (error) {
			return fail(400, { error: (error as { message: string }).message });
		}
	}
};
```
2. Remove the `setAllCompleted` function from `+page.svelte`, and also modify the two buttons to use Form actions:

```svelte
<!-- div
  <button on:click={() => setAllCompleted(true)}>Set all as Completed</button>
  <button on:click={() => setAllCompleted(false)}>Set all as Incomplete</button>
div -->
<form method="POST" use:enhance>
  <button formaction="?/setAllComplete">Set all as Completed</button>
  <button formaction="?/setAllInComplete">Set all as Incomplete</button>
</form>
```

### Refactor #2: Using Backend Methods
Even though all the functions we have created in `src/routes/+page.server.ts` execute server-side, they are coupled to the home page at `src/routes/+page.svelte`. This means that we cannot re-use these functions from other pages.

Remult provides a mechanism for declaring re-usable backend functions: 

1. Create a new `TasksController` class, in the `shared` folder, and refactor into a new, `static`, `setAllCompleted` method in the `TasksController` class, which will run on the server.

```ts
// src/shared/TasksController.ts

import { BackendMethod, remult } from "remult"
import { Task } from "./Task"

export class TasksController {
  @BackendMethod({ allowed: true })
  static async setAllCompleted(completed: boolean) {
    const taskRepo = remult.repo(Task)

    for (const task of await taskRepo.find()) {
      await taskRepo.update(task.id, { completed });
    }
  }
}
```

The `@BackendMethod` decorator tells Remult to expose the method as an API endpoint (`/api/setAllCompleted`) and allow CRUD operations on this end-point.

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

3. Recreate the `setAllCompleted` function in `+page.svelte` to invoke `setAllCompleted` method in the `TasksController`.

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

4. Revert the two buttons in `+page.svelte` back to what they were before:

```svelte
<div
  <button on:click={() => setAllCompleted(true)}>Set all as Completed</button>
  <button on:click={() => setAllCompleted(false)}>Set all as Incomplete</button>
div>
<!-- form method="POST" use:enhance>
  <button formaction="?/setAllComplete">Set all as Completed</button>
  <button formaction="?/setAllInComplete">Set all as Incomplete</button>
</form !-->
```

After the browser is refreshed, the _"Set all..."_ buttons function exactly the same. Futhermore, since the `setAllCompleted` is a Remult `@BackendMethod`, it creates an endpoint that can be invoked from anywhere within and without the application.

5. You can now delete the `setAllComplete` and `setAllIncomplete` form actions inside `+page.server.ts`.