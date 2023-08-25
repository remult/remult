<script lang="ts">
  import { remult } from 'remult'
  import { Task } from '../shared/task'

  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { signOut } from '@auth/sveltekit/client'
  import '../app.css'
  import { remultLive } from '$lib/stores/remultLive'
  import { TasksController } from '../shared/tasksController'
  import type { PageData } from './$types'

  export let data: PageData

  // get the repo
  const taskRepo = remult.repo(Task)

  // Start with SSR tasks then subscribe to changes (respecting options!)
  const tasks = remultLive(taskRepo, data.tasks)
  $: browser && tasks.listen(data.options)

  let newTaskTitle = ''

  async function addTask() {
    try {
      const newTask = await taskRepo.insert({ title: newTaskTitle })
      newTaskTitle = ''
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

  function updateLimit(direction: 'MORE' | 'LESS') {
    const limit = parseInt($page.url.searchParams.get('limit') || '3')
    const newLimit = direction === 'MORE' ? limit + 1 : limit - 1

    // Let's not go bellow 1!
    if (newLimit < 1) return

    goto(`/?limit=${newLimit}`)
  }
</script>

<h1>Todos</h1>
<main>
  <div>
    Hello {remult.user?.name} <button on:click={signOut}>Sign Out</button>
  </div>
  <div>
    <button on:click={() => updateLimit('LESS')}>Less</button>
    <i>Show</i>
    <button on:click={() => updateLimit('MORE')}>More</button>
  </div>
  <form on:submit|preventDefault={addTask}>
    <input
      title={!taskRepo.metadata.apiInsertAllowed()
        ? 'Sign in as Jane to add tasks'
        : 'Be creative in your description!'}
      disabled={!taskRepo.metadata.apiInsertAllowed()}
      bind:value={newTaskTitle}
      placeholder="What needs to be done?"
    />
    <button disabled={!taskRepo.metadata.apiInsertAllowed()}>Add</button>
  </form>
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
