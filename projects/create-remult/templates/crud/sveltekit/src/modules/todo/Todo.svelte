<script lang="ts">
  import { EntityError, repo } from "remult";
  import { Task } from "./Task";
  import Tile from "../Tile.svelte";

  let tasks: Task[] = $state([]);
  let hideCompleted = $state(false);
  let task = $state(repo(Task).create());
  let errorMsg = $state("");

  function toggleHideCompleted() {
    hideCompleted = !hideCompleted;
  }

  // For demo purposes. By default we are in liveQuery mode.
  const liveQuery = true;

  $effect(() => {
    if (!liveQuery) {
      repo(Task)
        .find({
          where: { completed: hideCompleted ? false : undefined },
          orderBy: { createdAt: "desc" },
        })
        .then((_tasks) => {
          tasks = _tasks;
        });
    } else {
      return repo(Task)
        .liveQuery({
          where: { completed: hideCompleted ? false : undefined },
          orderBy: { createdAt: "desc" },
        })
        .subscribe((info) => {
          tasks = info.items;
        });
    }
  });

  const addTask = async (e: Event) => {
    e.preventDefault();
    errorMsg = "";
    try {
      const newTask = await repo(Task).insert(task);
      if (!liveQuery) {
        tasks.unshift(newTask);
      }
      task = repo(Task).create();
    } catch (error) {
      errorMsg = error instanceof EntityError ? error.message : "Unknown error";
    }
  };

  const setCompleted = async (task: Task, completed: boolean) => {
    return await repo(Task).update(task.id, { completed });
  };

  const deleteTask = async (task: Task) => {
    await repo(Task).delete(task);
    if (!liveQuery) {
      tasks = tasks.filter((c) => c.id !== task.id);
    }
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
    {#if errorMsg}
      <div class="message error">
        <p>{errorMsg}</p>
      </div>
    {/if}
    <form onsubmit={addTask}>
      <input
        bind:value={task.title}
        placeholder="What needs to be done?"
        type="text"
      />
      <button type="submit">
        <img src="plus.svg" alt="Add" />
      </button>
    </form>
    {#each tasks as task, i}
      <div class="todo__task {task.completed ? 'completed' : ''}">
        <input
          id={task.id}
          type="checkbox"
          bind:checked={task.completed}
          oninput={async (e) => {
            tasks[i] = await setCompleted(task, e.currentTarget.checked);
          }}
        />
        <span>
          <label for={task.id}>{task.title}</label>
        </span>
        <button onclick={() => deleteTask(task)}>
          <img src="trash.svg" alt="Delete" />
        </button>
      </div>
    {/each}
  </main>
  <div class="button-row">
    <button onclick={toggleHideCompleted}>
      {hideCompleted ? "Show" : "Hide"} completed
    </button>
  </div>
</Tile>
