import type { CodeStep } from '../stepsData.js'

export default {
  id: 'step-03',
  name: 'Add a form',
  stepTime: 1 * 60,
  cta: [
    {
      label: 'More about validation',
      href: '/docs',
    },
    {
      label: 'More about auth',
      href: '/docs',
    },
  ],
  files: [
    {
      name: 'entity.ts',
      keyContext: 'backend',
      content: `import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string()
  title: string = ''
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
  import { repo } from "remult";
  import { Task } from "./entity";

  let tasks = $state<Task[]>([]);
  let newTask = $state(repo(Task).create()) // set default values [!code ++]

  $effect(() => {
    repo(Task).find().then((t) => (tasks = t));
  });

  const addTask = async (e: Event) => { // [!code ++]
    e.preventDefault(); // [!code ++]
    newTask = await repo(Task).insert(newTask); // [!code ++]
    tasks.push(newTask) // [!code ++]
    newTask = repo(Task).create(); // reset the form [!code ++] 
  }; // [!code ++]
</script>

<form onsubmit={addTask}> // [!code ++]
  <input bind:value={newTask.title} /> // [!code ++]
  <button>Add</button> // [!code ++]
</form> // [!code ++]

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
} satisfies CodeStep
