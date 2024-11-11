<script lang="ts">
  import { repo } from 'remult'
  import { Task } from '../shared/Task'
  import { onDestroy } from 'svelte'
  import { TasksController } from '../shared/TasksController'

  let tasks = $state<Task[]>([])
  let unSub: (() => void) | null = null

  $effect(() => {
    // repo(Task)
    //   .find()
    //   .then((t) => (tasks = t));
    unSub = repo(Task)
      .liveQuery()
      .subscribe((info) => {
        tasks = info.applyChanges(tasks)
      })
  })

  onDestroy(() => {
    unSub && unSub()
  })

  let newTaskTitle = $state('')
  const addTask = async (event: Event) => {
    event.preventDefault()
    try {
      const newTask = await repo(Task).insert({ title: newTaskTitle })
      // tasks = [...tasks, newTask];
      newTaskTitle = ''
    } catch (error) {
      alert((error as { message: string }).message)
    }
  }

  const setCompleted = async (task: Task, completed: boolean) => {
    try {
      await repo(Task).save({ ...task, completed })
    } catch (error) {
      alert((error as { message: string }).message)
    }
  }

  const saveTask = async (e: Event, task: Task) => {
    e.preventDefault()
    try {
      await repo(Task).save({ ...task })
    } catch (error) {
      alert((error as { message: string }).message)
    }
  }

  const deleteTask = async (e: Event, task: Task) => {
    try {
      await repo(Task).delete(task)
      // tasks = tasks.filter((c) => c.id !== task.id);
    } catch (error) {
      alert((error as { message: string }).message)
    }
  }

  async function setAllCompleted(completed: boolean) {
    // for (const task of await repo(Task).find()) {
    //   await repo(Task).save({ ...task, completed });
    // }
    await TasksController.setAllCompleted(completed)
  }
</script>

<div>
  <h1>todos</h1>
  <main>
    {#if repo(Task).metadata.apiInsertAllowed()}
      <form onsubmit={addTask}>
        <input bind:value={newTaskTitle} placeholder="What needs to be done?" />
        <button>Add</button>
      </form>
    {/if}

    {#each tasks as task}
      <div>
        <input
          type="checkbox"
          checked={task.completed}
          oninput={(e) => setCompleted(task, e.currentTarget.checked)}
        />
        <!-- <span>{task.title}</span> -->
        <input name="title" bind:value={task.title} />
        <button onclick={(e) => saveTask(e, task)}>Save</button>
        {#if repo(Task).metadata.apiDeleteAllowed()}
          <button onclick={(e) => deleteTask(e, task)}>Delete</button>
        {/if}
      </div>
    {/each}
    <!-- sdsd -->
    <div>
      <button onclick={() => setAllCompleted(true)}>Mark All Completed</button>
      <button onclick={() => setAllCompleted(false)}>Mark All Incomplete</button
      >
    </div>
  </main>
</div>
