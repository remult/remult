<script lang="ts">
  import { TasksController } from '../shared/TasksController'

  const add = async () => {
    await TasksController.addHeader('Hello_' + new Date().getSeconds() + '_s')
  }
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/water.css@2/out/dark.css"
  />
</svelte:head>

<h2>SvelteKit</h2>

<button on:click={add}>Add to Header & Cookie</button>

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
    <a href="/api/ff">Go to /api/ff</a>
  </li>
</ul>
