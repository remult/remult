<script lang="ts">
  import { repo } from 'remult'
  import { TasksController } from '../shared/TasksController'
  import { Task } from '../shared/Task.js'

  const add = async () => {
    await TasksController.addHeader('Hello_' + new Date().getSeconds() + '_s')

    await repo(Task).find({})
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
