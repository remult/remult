<script lang="ts">
  import { EntityError, remult, repo } from 'remult'
  import { Task } from '../shared/Task'
  import { TasksController } from '../shared/TasksController'
  import { signOut } from '@auth/sveltekit/client'

  let tasks = $state<Task[]>([])

  $effect(() => {
    // repo(Task)
    //   .find()
    //   .then((t) => (tasks = t));
    return repo(Task)
      .liveQuery()
      .subscribe((info) => {
        tasks = info.applyChanges(tasks)
      })
  })

  let newTaskTitle = $state('')
  const addTask = async (event: Event) => {
    event.preventDefault()
    try {
      const newTask = await repo(Task).insert({ title: newTaskTitle })
      // tasks = [...tasks, newTask];
      newTaskTitle = ''
    } catch (error) {
      if (error instanceof EntityError) {
        alert(error.message)
      }
    }
  }

  const setCompleted = async (task: Task, completed: boolean) => {
    try {
      await repo(Task).update(task.id, { completed })
    } catch (error) {
      if (error instanceof EntityError) {
        alert(error.message)
      }
    }
  }

  const saveTask = async (e: Event, task: Task) => {
    e.preventDefault()
    try {
      await repo(Task).save(task)
    } catch (error) {
      if (error instanceof EntityError) {
        alert(error.message)
      }
    }
  }

  const deleteTask = async (e: Event, task: Task) => {
    try {
      await repo(Task).delete(task)
      // tasks = tasks.filter((c) => c.id !== task.id);
    } catch (error) {
      if (error instanceof EntityError) {
        alert(error.message)
      }
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
    <div>
      Hello {remult.user?.name}
      <button onclick={async () => signOut()}>Logout</button>
    </div>
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
