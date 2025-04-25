import type { CodeStepInput } from '../stepsData.js'
import previousStep from './step02.js'

export default {
  name: 'Add a form',
  stepTime: 3 * 60,
  cta: [],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      content: previousStep.files.find((c) => c.name === 'entities.ts')!.content,
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
  let newTask = $state(repo(Task).create()) // set default values [!code ++]

  $effect(() => {
    repo(Task).find({/*...*/}).then((t) => (tasks = t))
  })

  const addTask = async (e: Event) => { // [!code ++]
    e.preventDefault() // [!code ++]
    const t = await repo(Task).insert(newTask) // [!code ++]
    tasks.push(t) // [!code ++]
    newTask = repo(Task).create() // reset the form [!code ++] 
  } // [!code ++]
</script>

<form onsubmit={addTask}> // [!code ++]
  <input bind:value={newTask.title} /> // [!code ++]
  <button>Add</button> // [!code ++]
</form> // [!code ++]

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
