# Live Queries :rocket:

::: tip New Feature
Live queries are a new feature introduced in version 0.18.
:::

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh their browser.

Let's add realtime multiplayer capabilities to this app.

## Realtime updated todo list

Let's switch from fetching Tasks once when the app is loaded (`+page.svelte.load()`), and subscribe to Remult's `liveQuery()` which will  then update our data in realtime **for both initial data fetching and subsequent state changes**.

```ts
// src/routes/+page.svelte

<script lang="ts">
	import { remult } from 'remult';
	import { Task } from '../shared/Task';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	export let data;
	export let form;

	const taskRepo = remult.repo(Task);
	let unSub = () => {};
	//$: tasks = data.tasks;
	let tasks: Task[] = [];

	onMount(() => {
		if (browser) {
			unSub = taskRepo.liveQuery(data.options).subscribe((info) => {
				console.log('INFO:', info);
				tasks = info.applyChanges(tasks);
			});
		} else {
			//tasks = data.tasks
		}
	});

	onDestroy(() => {
		if (browser) unSub();
	});
</script>
<!-- ... -->
```

Let's review the changes:

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method to define the query, and then call its `subscribe` method to establish a subscription which will update the Tasks state in realtime.

- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up-to-date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we use the return value to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received

- The `subscribe` method returns an `unsubscribe` function, which we use in the `onDestroy` hook to unsubscribe when the component unmounts.

- Sveltekit runs the `load` function twice - once on the server (Server-Side Rendering), and another on the client during hydration. We use the `browser` property to determine in which environment the app is running. We have commented out sections of the app that rely on server-side `load` function. All updates use the `liveQuery`.

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.

For scalable production / serverless environments, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/), and live-query information can be stored to any database supported by Remult.
:::
