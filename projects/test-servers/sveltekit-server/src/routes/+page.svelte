<script lang="ts">
  import { repo } from 'remult'
  import { TasksController } from '../shared/TasksController'
  import { Task } from '../shared/Task.js'
  import { onMount } from 'svelte'

  let tasks: Task[] = $state([])

  onMount(async () => {
    tasks = await repo(Task).find()
  })

  const addCookie = async () => {
    await TasksController.addHeader('Hello_' + new Date().getSeconds() + '_s')
  }

  const addTask = async () => {
    const t = await repo(Task).insert({
      title: 'Task ' + new Date().toISOString(),
    })
    tasks.push(t)
  }

  const deleteTask = async (task: Task) => {
    await repo(Task).delete(task)
    tasks = tasks.filter((t) => t.id !== task.id)
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/water.css@2/out/dark.css"
  />
</svelte:head>

<h2>SvelteKit</h2>

<button onclick={addCookie}>Add to Header & Cookie</button>

<hr />

<h2>Tasks</h2>
<button onclick={addTask}>Add a random Task</button>

<ul>
  {#each tasks as task}
    <li>
      <button onclick={() => deleteTask(task)}>Delete</button>
      {task.title}
    </li>
  {/each}
</ul>
