<script lang="ts">
  import { remult } from "remult";
  import { onMount } from "svelte";
  import { Task } from "./Task";

  let tasks: Task[] = [];
  let page = 1;

  onMount(async () => {
    tasks = await remult.repo(Task).find({
      page: page,
      limit: 5,
    });
  });
  let newTaskTitle = "";
  const addTask = async () => {
    const newTask = await remult.repo(Task).insert({ title: newTaskTitle });
    tasks = [...tasks, newTask];
    newTaskTitle = "";
  };
  const setCompleted = async (task: Task, completed: boolean) => {
    await remult.repo(Task).save({ ...task, completed });
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
          on:change={(e) => setCompleted(task, e.target?.checked)}
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
