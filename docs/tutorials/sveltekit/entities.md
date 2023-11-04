# Entities

Let's start coding the app by defining the `Task` entity class.

The `Task` entity class will be used:

- As a model class for client-side code
- As a model class for server-side code
- By `remult` to generate API endpoints, API queries, and database commands

The `Task` entity class we're creating will have an auto-generated `id` field, a `title` field, a `completed` field and an auto-generated `createdAt` field. The entity's API route ("tasks") will include endpoints for all `CRUD` operations. 

## Define the Model

We'll start off with a simple class:

```ts
class Task {
	id!: string;
	title: string = "";
	completed: boolean = false;
	completedAt?: Date;
}
```
... and then convert into a Remult entity by garnishing it with Typescript decorators.

1. Create a `shared` folder under the `src` folder. This folder will contain code shared between the frontend and the backend.

2. Create a file `Task.ts` in the `src/shared/` folder, with the following code:

```ts
// src/shared/Task.ts

import { Entity, Fields } from "remult"

@Entity("tasks", {
  allowApiCrud: true
})
export class Task {
  @Fields.cuid()
  id!: string;

  @Fields.string()
  title: string = ""

  @Fields.boolean()
  completed: boolean = false

  @Fields.createdAt()
  createdAt?: Date
}
```

The [@Entity](../../docs/ref_entity.md) decorator tells Remult that this class is an entity class. The decorator accepts a `key` argument (used to name the API route and as the default database collection/table name), and an optional `options` object of type `EntityOptions`. This is used to define entity-related properties and operations, discussed in the next sections of this tutorial.

Initially, we are going to allow all CRUD operations on tasks, by setting the option [allowApiCrud](../../docs/ref_entity.md#allowapicrud) to `true`.

The [@Fields.cuid](../../docs/field-types.md#fields-cuid) decorator tells Remult to automatically generate a short random id using the [cuid](https://github.com/paralleldrive/cuid) library. This value can't be changed after the entity is created.

The [@Fields.string](../../docs/field-types.md#fields-string) decorator tells Remult the `title` property is an entity data field of type `String`. This decorator is also used to define field-related properties and operations, discussed in the next sections of this tutorial and the same goes for `@Fields.boolean` and the `completed` property.

The [@Fields.createdAt](../../docs/field-types.md#fields-createdat) decorator tells Remult to automatically generate a `createdAt` field with the current date and time.

::: tip
For a complete list of supported field types, see the [Field Types](../../docs/field-types.md) section in the Remult documentation.
:::

3. Register the `Task` entity with Remult by adding `entities: [Task]` to the `options` object that is passed to the `remultSveltekit()` middleware:

```ts
// src/hooks.server.ts

import { remultSveltekit } from "remult/remult-sveltekit"
import { Task } from "./shared/Task"

export const api = remultSveltekit({
  entities: [Task]
})
```

## Test the API

Now that the `Task` entity is defined, we can start using the REST API to query and add tasks. By default Remult exposes the `/api/` endpoint. Resources (entities) can then be accessed by appending the entity's `key` -- _tasks_ in this case.

1. Open a browser with the url: [http://localhost:5173/api/tasks](http://localhost:5173/api/tasks), and you'll see that you get an empty array.

2. Use `curl` to `POST` a new task - *Clean car*. If you prefer, you can use a graphical tool such as Postman, Insomnia or Thunder Client.

```sh
curl http://localhost:5173/api/tasks -d "{\"title\": \"Clean car\"}" -H "Content-Type: application/json"
```

3. Refresh the browser for the url: [http://localhost:5173/api/tasks](http://localhost:5173/api/tasks) and notice that the array now contains one item.

4. The `POST` endpoint can accept a single `Task` or an array of `Task`s. Add a few more tasks:

```sh
curl http://localhost:5173/api/tasks -d "[{\"title\": \"Read a book\"},{\"title\": \"Take a nap\", \"completed\":true },{\"title\": \"Pay bills\"},{\"title\": \"Do laundry\"}]" -H "Content-Type: application/json"
```

5. Refresh the browser again, to see that the new tasks were stored in the db.

::: warning Wait, where is the backend database?
While remult supports [many relational and non-relational databases](https://remult.dev/docs/databases.html), in this tutorial we start off by storing entity data in a backend **JSON file**. Notice that a `db` folder has been created under the root folder, with a `tasks.json` file containing the created tasks.
:::

## Display the Task List

Let's start developing the web app by displaying the list of existing tasks.

First, load the tasks server-side by creating `src/routes/+page.server.ts` with the following code:

```svelte
// src/routes/+page.server.svelte

import type { PageServerLoad } from "./$types";
import { remult } from "remult";
import { Task } from "../shared/Task";

export const load = (async () => {
    const taskRepo = remult.repo(Task);
    const tasks = await taskRepo.find()
    return {
        tasks: structuredClone(tasks)
    };
}) satisfies PageServerLoad;
```
::: tip
Sveltekit will work just as well without typing the `load` function. As such, you can remove the `satisfies PageServerLoad` and the correspoding import and you'll be just fine.
:::

Next, let's consume the tasks from the front-end. Replace the contents of `src/routes/+page.svelte` with the following:

```svelte
<script lang="ts">
	import type { Task } from "../shared/Task";

	export let data;
	const tasks:Task[] = data.tasks;
</script>

<svelte:head>
	<title>Remult+Sveltekit Todo App</title>
</svelte:head>

<div>
  <h1>todos</h1>
  <main>
    {#each tasks as task}
      <div>
        <input type="checkbox" bind:checked={ task.completed } />
        <span>{ task.title }</span>
      </div>
    {/each}
  </main>
</div>
```

Here's a quick overview of the different parts of the code snippet:

- `taskRepo` is a Remult [Repository](../../docs/ref_repository.md) object used to fetch and create Task entity objects.
- The `tasks` are returned from `+page.server.ts` and accessible in `+page.svelte` as `data.tasks`. 
- The content returned from `taskRepo.find()` is not a plain Javascript object (POJO) and cannot be serialized on the front-end. We use [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) to deep-clone the tasks into a serializable form. structuredClone was introduced in Node.js version 17 - so if you are using an older version, you can substitute `structuredClone(tasks)` with `JSON.parse(JSON.stringify(tasks))`.

After the browser refreshes, the list of tasks appears.

### Styling the Output
Remult is un-opinionated in as far as front-end styling is concerned. To demonstrate, let's style our app using vanilla CSS.

1. First, create a file `app.css` in `src`:

```css
/* src/app.css */

@charset "utf-8";

body {
    font-family: Arial;
    background-color: whitesmoke;
    justify-content: center;
    margin: 0;
}

h1 {
    color: #ef4444;
    font-style: italic;
    font-size: 3.75rem;
    font-weight: inherit;
    text-align: center;
}

main {
    max-width: 500px;
    min-width: 300px;
    margin: auto;
    background-color: white;
    box-sizing: border-box;
    border: 1px solid lightgray;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px #0003, 0 25px 50px #0000001a;
}

main > div,
main > form {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid lightgray;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: space-between;
}

main > div:has(input[type="checkbox"]) {
    justify-content: inherit;
}

input {
    font-family: inherit;
    font-size: 100%;
    width: 100%;
    border: 0;
    padding: 0.5rem;
}

input:checked + input,
input:checked + span {
    text-decoration: line-through;
}

input:placeholder-shown {
    font-style: italic;
}

input[type="checkbox"] {
    width: 36px;
    height: 36px;
    height: 1.5rem;
}

button {
    cursor: pointer;
    padding: 0.5rem 0.5rem;
    background-color: white;
    font-family: inherit;
    font-size: 85%;
    line-height: inherit;
    border: 2px solid #0000001a;
    border-radius: 0.5rem;
}

```

2. Next, create a file `src/routes/+layout.svelte` file and import the CSS into the file:

```svelte
// src/routes/+layout.svelte

<script lang="ts">
    import "../app.css"
</script>

<slot />
```

...and voila!, our app should look much better!! Feel free to improve or substitute the styling as you deem fit.

::: tip
The styles imported into `src/routes/+layout.svelte` will apply to all pages in the app - unless explicitly overriden.
:::
