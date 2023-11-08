# CRUD Operations

## Adding new tasks

Now that we can see the list of tasks, it's time to add a few more. We create a form which executes the `addTask` function that invokes `taskRepo.insert()`. Update your `+page.svelte` as follows:

```svelte
// src/routes/+page.svelte

<script lang="ts">
	import { remult } from 'remult';
	import { Task } from '../shared/Task.js';

	export let data;

	let tasks = data.tasks;
	let newTaskTitle = '';

	const taskRepo = remult.repo(Task);

	const addTask = async () => {
		const newTask = await taskRepo.insert({ title: newTaskTitle });
		tasks = [...tasks, newTask];
		newTaskTitle = '';
	};
</script>

<svelte:head>
	<title>Remult+Sveltekit Todo App</title>
</svelte:head>

<div>
	<h1>todos</h1>
	<main>
		<form method="POST" on:submit|preventDefault={addTask}>
			<input bind:value={newTaskTitle} placeholder="What needs to be done?" />
			<button>Add</button>
		</form>

		{#each tasks as task}
			<div>
				<input type="checkbox" bind:checked={task.completed} />
				<span>{task.title}</span>
			</div>
		{/each}
	</main>
</div>
```

Try adding a few tasks to see how it works.

## Mark Tasks as Completed

1. Add a `setCompleted` function in the script section as follows:

```ts
const setCompleted = async (task: Task, completed: boolean) => {
  await taskRepo.save({ ...task, completed })
}
```

2. Modify the checkbox to invoke the method:

```svelte
<div>
	<input
		type="checkbox"
		bind:checked={task.completed}
		on:click={(e) => setCompleted(task, e.target.checked)}
	/>
	{task.title}
</div>
```

## Rename Tasks

To make the tasks in the list updatable, we'll use an `input` element and bind it to the task's `title` property. We'll also add a _Save_ button to commit the changes to the backend database.

Here's the updated `+page.svelte`

```svelte
// src/routes/+page.svelte

<script lang="ts">
	import { remult } from 'remult';
	import { Task } from '../shared/Task';

	export let data;

	let tasks = data.tasks || [];
	let newTaskTitle = '';

	const taskRepo = remult.repo(Task);

	const addTask = async () => {
		const newTask = await taskRepo.insert({ title: newTaskTitle });
		tasks = [...tasks, newTask];
		newTaskTitle = '';
	};

	const setCompleted = async (task: Task, completed: boolean) => {
		await taskRepo.save({ ...task, completed });
	};

	const saveTask = async (task: Task) => {
		await taskRepo.save({ ...task });
	};
</script>

<svelte:head>
	<title>Remult+Sveltekit Todo App</title>
</svelte:head>

<div>
	<h1>todos</h1>
	<main>
		<form method="POST" on:submit|preventDefault={addTask}>
			<input bind:value={newTaskTitle} placeholder="What needs to be done?" />
			<button>Add</button>
		</form>

		{#each tasks as task}
			<div>
				<input
					type="checkbox"
					bind:checked={task.completed}
					on:click={(e) => setCompleted(task, e.target.checked)}
				/>
				<input name="title" bind:value={task.title} />
				<button on:click={() => saveTask(task)}>Save</button>
			</div>
		{/each}
	</main>
</div>

```

- The `saveTask` function saves the task that is passed in. Since the task's title is bound to the `input`, changes are made directly to the task.

Make some changes and refresh the browser to verify that the backend database is updated.

::: tip
You may have to restart the Dev Server, and refresh your browser for these effects to take effect.
:::

## Delete Tasks

Let's add a _Delete_ button next to the **Save** button of each task in the list. Add the `deleteTask` function and the **Delete** button:

To start us off, lets edit the markup in `+page.svelte` to wrap add the Delete button:

```svelte
// src/routes/+page.svelte

// ...
<main>
  <!-- ... -->
  {#each tasks as task}
    <div>
      <h1>todos</h1>
      <div>
        <input type="checkbox" bind:checked={task.completed} />
        { task.title }
        <form method="POST" action="?/deleteTask">
          <input name="id" type="hidden" value="{task.id}" />
          <button>Delete</button>
        </form>
      </div>
    </div>
  {/each}
  </main>
</div>
```

Next, edit `+page.server.ts` and add the `deleteTask` method inside `actions`:

```svelte
export const actions = {
  addTask: async ({ request }) => {
      // ...
  },

  deleteTask: async ({ request }) => {
    try {
        const formData = await request.formData();
        const id = formData.get("id") as string;
        await taskRepo.delete(id);
        return {
            success: true,
            message: 'Task deleted succesfully'
        };
    } catch (error) {
        return fail(400, { error: (error as { message: string }).message });
    }
  },
};
```
