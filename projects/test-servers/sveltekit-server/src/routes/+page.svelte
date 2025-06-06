<script lang="ts">
  import { repo } from 'remult'
  // import { Task } from '../../../shared/modules/task/Task.js'
  // import { ResBackendMethodController } from '../../../shared/modules/resBackendMethod/ResBackendMethodController.js'
  import { onMount } from 'svelte'
  import { Task } from '../shared/Task.js'
  let tasks: Task[] = []
  const addHeaderCookie = async () => {
    // await ResBackendMethodController.addHeader(
    //   'Hello_h_' + new Date().getSeconds() + '_s',
    // )
    // await ResBackendMethodController.addCookie(
    //   'Hello_c_' + new Date().getSeconds() + '_s',
    // )
  }
  onMount(async () => {
    tasks = await repo(Task).find({})
  })
  const addTask = async () => {
    const t = await repo(Task).insert({
      title: 'Task ' + new Date().toISOString(),
    })
    tasks = [...tasks, t]
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/water.css@2/out/dark.css"
  />
</svelte:head>

<h2>SvelteKit</h2>

<button onclick={addHeaderCookie}>Add to Header & Cookie</button>

<h2>Extra Routes</h2>

<ul>
  <li>
    <a href="/">Go to home</a>
  </li>
  <li>
    <a href="/api/new-route">Go to /api/new-route</a>
  </li>
  <li>
    <a href="/api/html">Go to /api/html</a>
  </li>
  <li>
    <a href="/api/redirect">Go to /api/redirect</a>
  </li>
  <li>
    <a href="/api/redirect-ext">Go to /api/redirect-ext</a>
  </li>
  <li>
    <a href="/api/setCookie">Go to /api/setCookie</a>
  </li>
  <li>
    <a href="/api/deleteCookie">Go to /api/deleteCookie</a>
  </li>
  <li>
    <a href="/api/styled">Go to /api/styled</a>
  </li>
  <li>
    <a href="/api/ff">Go to /api/ff (should be 404!)</a>
  </li>
</ul>

<h2>Tasks</h2>

<button onclick={addTask}>Add Task</button>

{#each tasks as task}
  <li>
    <button
      onclick={() => {
        repo(Task).delete(task)
        tasks = tasks.filter((t) => t.id !== task.id)
      }}>Delete</button
    >
    {task.title}
  </li>
{/each}
