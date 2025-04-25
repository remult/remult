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
      changed: true,
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `import { useEffect, useState } from 'react'
import { repo } from 'remult'
import { Task } from './entities'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  useEffect(() => {
    repo(Task).find({ /*...*/ }).then(setTasks)
  }, [])

  const addTask = async (e: FormEvent) => { 
    try { 
      e.preventDefault() 
      const newTask = await repo(Task).insert({ title: newTaskTitle }) 
      setTasks([...tasks, newTask]) 
      setNewTaskTitle("")
    } catch (e) {
      console.log(e)  
    } 
  } 

  return (
    <div>
      <form onSubmit={addTask}> 
        <label>{repo(Task).metadata.fields.title.caption}</label>
        <input
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
        /> 
        <button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button> // [!code ++]
      </form>
      {tasks.map((task) => {
        return (
          <div key={task.id}>
            {task.title}
          </div>
        )
      })}
    </div>
  )
}`,
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
    repo(Task).find({ /*...*/ }).then((items) => (tasks = items))
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
  <div>{task.title}</div>
{/each}`,
    },
    {
      name: 'page.vue',
      keyContext: 'frontend',
      changed: true,
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { repo } from 'remult'
  import { Task } from './entities'

  const tasks = ref<Task[]>([])
  const newTask = ref(repo(Task).create())
  
  onMounted(() => {
    repo(Task).find({ /* ... */ }).then((items) => (tasks.value = items))
  })

  async function addTask() {
    try { 
      const t = await repo(Task).insert(newTask.value)
      tasks.value.push(t)
      newTask.value = repo(Task).create() 
    } catch (e) { 
      console.log(e)    
    } 
  }
</script>

<template>
  <form @submit.prevent="addTask()">
    <label>{repo(Task).metadata.fields.title.caption}</label>
    <input v-model="newTask.title" />
    <button v-if="taskRepo.metadata.apiDeleteAllowed(task)">Add</button> // [!code ++]
  </form>
  <div v-for="task in tasks">
    {{ task.title }}
  </div>
</template>`,
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
