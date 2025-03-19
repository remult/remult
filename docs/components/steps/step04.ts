import type { CodeStep } from '../stepsData.js'

export default {
  id: 'step-04',
  name: 'Add label as metadata',
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
  let newTask = $state(repo(Task).create()) 

  $effect(() => {
    repo(Task).find().then((t) => (tasks = t));
  });

  const addTask = async (e: Event) => { 
    e.preventDefault(); 
    newTask = await repo(Task).insert(newTask); 
    tasks.push(newTask) 
    newTask = repo(Task).create(); 
  }; 
</script>

<form onsubmit={addTask}> 
  <label>{repo(Task).metadata.fields.title.caption}</label> // [!code ++]
  <input bind:value={newTask.title} /> 
  <button>Add</button> 
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
} satisfies CodeStep
