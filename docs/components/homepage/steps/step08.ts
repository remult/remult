import type { CodeStepInput } from '../stepsData.js'
import previousStep from './step07.js'

export default {
  name: 'Live queries',
  cta: [],
  files: [
    {
      name: 'entity.ts',
      keyContext: 'backend',
      content: previousStep.files
        .find((c) => c.name === 'entity.ts')!
        // TODO JYC: what tsconfig ?
        // @ts-ignore
        .content.replaceAll('// [!code ++]', ''),
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
      import { repo } from "remult"
      import { Task } from "./entity"
    
      let tasks = $state<Task[]>([])
      let newTask = $state(repo(Task).create()) 
    
      $effect(() => {
        repo(Task).find({/*...*/}).then((t) => (tasks = t)) // [!code --]
        return repo(Task) // [!code ++]
          .liveQuery(/*...*/) // [!code ++]
          .subscribe((info) => { // [!code ++]
            tasks = info.applyChanges(tasks) // [!code ++]
          }) // [!code ++]
      })
    
      const addTask = async (e: Event) => { 
        try { 
          e.preventDefault()
          const t = await repo(Task).insert(newTask)
          tasks.push(t) // Will be added to the list by the live query [!code --] 
          newTask = repo(Task).create() 
        } catch (e) { 
          console.log(e)
        } 
      } 
    </script>
    
    <form onsubmit={addTask}> 
      <label>{repo(Task).metadata.fields.title.caption}</label>
      <input bind:value={newTask.title} /> 
      <button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button>
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
