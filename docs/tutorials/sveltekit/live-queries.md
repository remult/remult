# Live Queries

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh their browser.

Let's add realtime multiplayer capabilities to this app.

## Realtime updated todo list

Let's update our component like follows _(make sure you add and remove some lines as indicated)_

::: code-group

```svelte [/src/routes/+page.svelte]
<script lang="ts">
  import { remult } from "remult";
  import { onDestroy, onMount } from "svelte";
  import { Task } from "../shared/Task";

  let tasks: Task[] = [];
  let unSub: (() => void) | null = null;// [!code ++]

  onMount(async () => {
    unSub = remult// [!code ++]
      .repo(Task)// [!code ++]
      .liveQuery()// [!code ++]
      .subscribe((info) => {// [!code ++]
        tasks = info.applyChanges(tasks);// [!code ++]
      });// [!code ++]
    // tasks = await remult.repo(Task).find();// [!code --]
  });

  onDestroy(() => {// [!code ++]
    unSub && unSub();// [!code ++]
  }); // [!code ++]

  let newTaskTitle = "";
  const addTask = async () => {
    try {
      const newTask = await remult.repo(Task).insert({ title: newTaskTitle });
      // tasks = [...tasks, newTask]; // [!code --]
      newTaskTitle = "";
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };

  const setCompleted = async (task: Task, completed: boolean) => {
    try {
      await remult.repo(Task).save({ ...task, completed });
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };

  const saveTask = async (task: Task) => {
    try {
      await remult.repo(Task).save({ ...task });
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      await remult.repo(Task).delete(task);
      // tasks = tasks.filter((c) => c.id !== task.id); // [!code --]
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };
</script>

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
          on:click={(e) => setCompleted(task, e.target?.checked)}
        />
        <input name="title" bind:value={task.title} />
        <button on:click={() => saveTask(task)}>Save</button>
        <button on:click={() => deleteTask(task)}>Delete</button>
      </div>
    {/each}
  </main>
</div>
```

:::
Let's review the change:

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method to define the query, and then call its `subscribe` method to establish a subscription which will update the Tasks state in realtime.
- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up to date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we send that method to the `setTasks` state function, to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received
- The `subscribe` method returns an `unsubscribe` function, we return it to the `onDestroy` hook so that it'll be called when the component unmounts.

2. As all relevant CRUD operations (made by all users) will **immediately update the component's state**, we should remove the manual adding of new Tasks to the component's state:

::: code-group

```svelte [addTask]
const addTask = async () => {
    try {
      const newTask = await remult.repo(Task).insert({ title: newTaskTitle });
      // tasks = [...tasks, newTask]; // [!code --]
      newTaskTitle = "";
    } catch (error) {
      alert((error as { message: string }).message);
    }
  };

3. Optionally remove other redundant state changing code:
```

```ts [deleteTask]
async function deleteTask(task: Task) {
  try {
    await taskRepo.delete(task)
    //tasks.value = tasks.value.filter((t) => task !== t);  // [!code --]
  } catch (error) {
    alert((error as { message: string }).message)
  }
}
```

:::

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.

For scalable production / serverless environments, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/), and live-query information can be stored to any database supported by Remult.
:::
