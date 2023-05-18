<script lang="ts">
  import { remult } from "remult"
  import { Task } from "../shared/task"

  import { browser } from "$app/environment"
  import { signOut } from "@auth/sveltekit/client"
  import "../app.css"
  import { TasksController } from "../shared/tasksController"
  import type { PageData } from "./$types"
  import { remultStore } from "./remultStore"

  export let data: PageData

  // set the user (can't we do it globally?)
  remult.user = data.user

  // get the repo
  const taskRepo = remult.repo(Task)

  // Start with SSR tasks then subscribe to changes
  let tasks = remultStore<Task>(taskRepo, data.tasks)
  $: browser && tasks.init()

  let newTaskTitle = ""

  async function addTask() {
    try {
      const newTask = await taskRepo.insert({ title: newTaskTitle })
      newTaskTitle = ""
    } catch (error: any) {
      alert(error.message)
    }
  }
  async function deleteTask(task: Task) {
    try {
      await taskRepo.delete(task)
    } catch (error: any) {
      alert(error.message)
    }
  }
  async function saveTask(task: Task) {
    try {
      await taskRepo.save(task)
    } catch (error: any) {
      alert(error.message)
    }
  }
  async function setAllCompleted(completed: boolean) {
    await TasksController.setAllCompleted(completed)
  }
</script>

<h1>Todos</h1>
<main>
  <div>
    Hello {remult.user?.name} <button on:click={signOut}>Sign Out</button>
  </div>
  {#if taskRepo.metadata.apiInsertAllowed()}
    <form on:submit|preventDefault={addTask}>
      <input bind:value={newTaskTitle} placeholder="What needs to be done?" />
      <button>Add</button>
    </form>
  {/if}
  {#each $tasks as task}
    <div>
      <input
        type="checkbox"
        bind:checked={task.completed}
        on:change={() => saveTask(task)}
      />
      <input bind:value={task.title} />
      <button on:click={() => saveTask(task)}>Save</button>
      <button on:click={() => deleteTask(task)}>Delete</button>
    </div>
  {/each}
  <div>
    <button on:click={() => setAllCompleted(true)}>Set all completed</button>
    <button on:click={() => setAllCompleted(false)}>Set all UnCompleted</button>
  </div>
</main>
