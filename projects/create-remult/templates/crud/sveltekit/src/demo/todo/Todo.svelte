<script lang="ts">
  import { remult } from "remult";
  import { Task } from "./Task";
  import { browser } from "$app/environment";

  let tasks: Task[] = [];
  let page = 1;

  const refresh = async (_page: number) => {
    tasks = await remult.repo(Task).find({
      page: _page,
      limit: 5,
    });
  };

  $: browser && refresh(page);

  let newTaskTitle = "";
  const addTask = async () => {
    const newTask = await remult.repo(Task).insert({ title: newTaskTitle });
    tasks = [...tasks, newTask];
    newTaskTitle = "";
  };
  const setCompleted = async (task: Task, event: Event) => {
    const input = event.target as HTMLInputElement;
    await remult.repo(Task).save({ ...task, completed: input.checked });
  };
  const deleteTask = async (task: Task) => {
    await remult.repo(Task).delete(task);
    tasks = tasks.filter((c) => c.id !== task.id);
  };
</script>

<div>
  <strong>Todos</strong>
  <main>
    <form on:submit|preventDefault={addTask}>
      <input bind:value={newTaskTitle} placeholder="What needs to be done?" />
      <button>Add</button>
    </form>
    {#each tasks as task}
      <div>
        <input
          type="checkbox"
          bind:checked={task.completed}
          on:change={(e) => setCompleted(task, e)}
        />
        <span>{task.title}</span>
        <button on:click={() => deleteTask(task)}>Delete</button>
      </div>
    {/each}
  </main>
  <footer>
    <button on:click={() => (page -= 1)} disabled={page === 1}>
      Previous
    </button>
    <span>Page {page}</span>
    <button on:click={() => (page += 1)}>Next</button>
  </footer>
</div>
