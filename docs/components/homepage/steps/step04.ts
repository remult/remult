import type { CodeStepInput } from '../stepsData.js'

export default {
  name: 'Add label using metadata',
  cta: [
    {
      label: 'Adding your own options<span>(eg: placeholder)<span>',
      href: '/docs/custom-options#enhancing-field-and-entity-definitions-with-custom-options',
    },
  ],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      changed: true,
      content: `import { Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string({ 
    caption: 'Title of the task' // [!code ++]
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
    e.preventDefault()
    const t = await repo(Task).insert(newTask)
    tasks.push(t)
    newTask = repo(Task).create()
  }
</script>

<form onsubmit={addTask}> 
  <label>{repo(Task).metadata.fields.title.caption}</label> // [!code ++]
  <input bind:value={newTask.title} /> 
  <button>Add</button> 
</form> 

{#each tasks as task}
  <div>{task.title}</div>
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
