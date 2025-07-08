import type { CodeStepInput } from '../stepsData.js'
import previousStep from './step09.js'

const defaultApi = `import { createPostgresDataProvider } from 'remult/postgres' // or sqlite, mysql, mongo...

import { Task } from './entities'
import { auth } from '../modules/auth/server' // local module [!code ++]
import { mail } from 'firstly/mail/server'    // community module / library [!code ++]

export const api = remultApi({
  entities: [Task],
  dataProvider: createPostgresDataProvider(),
  admin: true,

  modules: [
    auth(),                                // better-auth, Auth.js, ... [!code ++] 
    mail({ from: 'noreply@example.com' }), // nodemailer [!code ++]
  ],
})`

export default {
  name: 'Using modules',
  cta: [
    {
      label: 'Modules guide',
      href: '/docs/modules',
    },
    {
      label: 'Community modules',
      href: '/docs/modules-community',
    },
  ],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      content: previousStep.files
        .find((c) => c.name === 'entities.ts')!
        // @ts-ignore
        .content.replaceAll('', ''),
    },
    // api
    {
      name: 'api.ts',
      keyContext: 'api',
      changed: true,
      framework: 'react',
      content: `import { remultApi } from 'remult/remult-express' // or next, fastify, ...
${defaultApi}`,
    },
    {
      name: 'api.ts',
      keyContext: 'api',
      changed: true,
      framework: 'svelte',
      content: `import { remultApi } from 'remult/remult-sveltekit'
${defaultApi}`,
    },
    {
      name: 'api.ts',
      keyContext: 'api',
      changed: true,
      framework: 'vue',
      content: `import { remultApi } from 'remult/remult-nuxt' // or express, fastify, ...
${defaultApi}`,
    },
    {
      name: 'api.ts',
      keyContext: 'api',
      changed: true,
      framework: 'angular',
      content: `import { remultApi } from 'remult/remult-express' // or fastify, ...
${defaultApi}`,
    },
    {
      name: 'page.tsx',
      keyContext: 'frontend',
      changed: false,
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `import { useEffect, useState } from 'react'
import { repo } from 'remult'
import { Task } from './entities'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  useEffect(() => {
    return repo(Task) 
      .liveQuery({ /* where: ...  */ }) 
      .subscribe((info) => { 
        setTasks(info.applyChanges(tasks)) 
      }) 
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
        <label>{repo(Task).metadata.fields.title.label}</label>
        <input
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
        /> 
        <button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button> 
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
      changed: false,
      framework: 'svelte',
      languageCodeHighlight: 'svelte',
      content: `<script lang="ts">
import { repo } from 'remult'
import { Task } from './entities'

let tasks = $state<Task[]>([])
let newTask = $state(repo(Task).create()) 

$effect(() => {
  return repo(Task) 
    .liveQuery({ /* where: ...  */ }) 
    .subscribe((info) => { 
      tasks = info.applyChanges(tasks) 
    }) 
})

const addTask = async (e: Event) => { 
  try { 
    e.preventDefault()
    const t = await repo(Task).insert(newTask)
    newTask = repo(Task).create() 
  } catch (e) { 
    console.log(e)
  } 
} 
</script>

<form onsubmit={addTask}> 
<label>{repo(Task).metadata.fields.title.label}</label>
<input bind:value={newTask.title} /> 
<button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button>
</form> 

{#each tasks as task}
<div>{task.title}</div>
{/each}`,
    },
    {
      name: 'page.vue',
      keyContext: 'frontend',
      changed: false,
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { repo } from 'remult'
  import { Task } from './entities'

  const tasks = ref<Task[]>([])
  const newTask = ref(repo(Task).create())
  
  onMounted(() => {
    return repo(Task) 
      .liveQuery({ /* where: ...  */ }) 
      .subscribe((info) => { 
        tasks.value = info.applyChanges(tasks.value) 
      }) 
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
    <label>{repo(Task).metadata.fields.title.label}</label>
    <input v-model="newTask.title" />
    <button v-if="taskRepo.metadata.apiDeleteAllowed(task)">Add</button> 
  </form>
  <div v-for="task in tasks">
    {{ task.title }}
  </div>
</template>`,
    },
    {
      name: 'todo.cmp.ts',
      keyContext: 'frontend',
      framework: 'angular',
      languageCodeHighlight: 'angular-ts',
      content: `import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { repo } from 'remult'
import { Task } from './entities'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.cmp.html'
})
export class TodoComponent implements OnInit, OnDestroy {
  tasks: Task[] = []
  newTask = repo(Task).create()
  titleLabel = repo(Task).metadata.fields.title.label
  error?: string
  canInsert = repo(Task).metadata.apiInsertAllowed()
  private subscription?: Subscription

  ngOnInit() {
    this.subscription = repo(Task) 
      .liveQuery({ /* where: ...  */ }) 
      .subscribe(info => { 
        this.tasks = info.applyChanges(this.tasks) 
      }) 
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe()
  }

  async addTask() {
    try {
      await repo(Task).insert(this.newTask)
      this.newTask = repo(Task).create()
      this.error = undefined
    } catch (e) {
      this.error = e.message
    }
  }
}`,
    },
    {
      name: 'todo.cmp.html',
      keyContext: 'frontend2',
      framework: 'angular',
      languageCodeHighlight: 'html',
      content: `<form (ngSubmit)="addTask()">
  <label>{{titleLabel}}</label>
  <input [(ngModel)]="newTask.title" name="title" />
  <button type="submit" [disabled]="!canInsert">Add</button>
  <div *ngIf="error" class="error">{{error}}</div>
</form>

<div *ngFor="let task of tasks">
  {{task.title}}
</div>`,
    },
  ],
} satisfies CodeStepInput
