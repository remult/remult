<script lang="ts">
  import { remult } from "remult";
  import { Task } from "./Task";
  import { browser } from "$app/environment";
  import Tile from "../Tile.svelte";

  let tasks: Task[] = [];
  let hideCompleted = false;
  function toggleHideCompleted() {
    hideCompleted = !hideCompleted;
  }

  const refresh = async (_hideCompleted: boolean) => {
    tasks = await remult.repo(Task).find({
      where: {
        completed: hideCompleted ? false : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  };

  $: browser && refresh(hideCompleted);

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

<Tile
  title="Todos"
  subtitle="Fully functional todo app"
  icon=""
  width="full"
  className="todo"
  status="Info"
>
  <main>
    <form on:submit|preventDefault={addTask}>
      <input
        bind:value={newTaskTitle}
        placeholder="What needs to be done?"
        type="text"
      />
      <button type="submit">
        <img src="plus.svg" alt="Add" />
      </button>
    </form>
    {#each tasks as task}
      <div class="todo__task {task.completed ? 'completed' : ''}">
        <input
          type="checkbox"
          bind:checked={task.completed}
          on:change={(e) => setCompleted(task, e)}
        />
        <span>{task.title}</span>
        <button on:click={() => deleteTask(task)}>
          <img src="trash.svg" alt="Delete" /></button
        >
      </div>
    {/each}
  </main>
  <div class="button-row">
    <button on:click={toggleHideCompleted}>
      {hideCompleted ? "Show" : "Hide"} completed
    </button>
  </div>
</Tile>
