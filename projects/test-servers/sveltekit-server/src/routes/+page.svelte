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
