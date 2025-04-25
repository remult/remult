import type { CodeStepInput } from '../stepsData.js'

export default {
  name: 'Add authorization',
  stepTime: 2 * 60,
  cta: [
    {
      label: 'More about Access Control',
      href: '/docs/access-control',
    },
  ],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      changed: true,
      content: `import { Entity, Fields, Validators, Allow } from 'remult'

@Entity<Task>('tasks', {
  allowApiRead: true, // [!code ++]
  allowApiInsert: Allow.authenticated, // [!code ++]
  allowApiUpdate: "admin", // Only users with the role "admin" [!code ++]
  allowApiDelete: false, // [!code ++]
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string({
    caption: 'Title of the task',
    validate: Validators.required
  })
  title = ''
}`,
    },
    {
      name: 'page.tsx',
      keyContext: 'frontend',
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `TODO`,
    },
    {
      name: '+page.svelte',
      keyContext: 'frontend',
      changed: true,
      framework: 'svelte',
      languageCodeHighlight: 'svelte',
      content: `<script lang="ts">
  import { repo } from 'remult'
  import { Task } from './entities'

  let tasks = $state<Task[]>([])
  let newTask = $state(repo(Task).create()) 

  $effect(() => {
    repo(Task).find({/*...*/}).then((t) => (tasks = t))
  })

  const addTask = async (e: Event) => { 
    try { 
      e.preventDefault()
      const t = await repo(Task).insert(newTask)
      tasks.push(t)
      newTask = repo(Task).create()
    } catch (e) { 
      console.log(e)
    } 
  } 
</script>

<form onsubmit={addTask}> 
  <label>{repo(Task).metadata.fields.title.caption}</label>
  <input bind:value={newTask.title} /> 
  <button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button> // [!code ++]
</form> 

{#each tasks as task}
  {task.title}
{/each}`,
    },
    {
      name: 'page.vue',
      keyContext: 'frontend',
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `TODO`,
    },
    {
      name: 'todo.component.ts',
      keyContext: 'frontend',
      framework: 'angular',
      languageCodeHighlight: 'angular-ts',
      content: `TODO`,
    },
    {
      name: 'todo.component.html',
      keyContext: 'frontend2',
      framework: 'angular',
      languageCodeHighlight: 'html',
      content: `TODO`,
    },
  ],
} satisfies CodeStepInput
