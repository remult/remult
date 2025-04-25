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
    e.preventDefault() 
    const newTask = await repo(Task).insert({ title: newTaskTitle }) 
    setTasks([...tasks, newTask]) 
    setNewTaskTitle("")  
  } 

  return (
    <div>
      <form onSubmit={addTask}> 
        <label>{repo(Task).metadata.fields.title.caption}</label> // [!code ++]
        <input
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
        /> 
        <button>Add</button>
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
    const t = await repo(Task).insert(newTask.value)
    tasks.value.push(t)
    newTask.value = repo(Task).create() 
  }
</script>

<template>
  <form @submit.prevent="addTask()">
    <label>{repo(Task).metadata.fields.title.caption}</label> // [!code ++]
    <input v-model="newTask.title" />
    <button>Add</button>
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
      content: `import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { repo } from 'remult'
import { Task } from './entities'

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css',
})
export class TodoComponent implements OnInit {
  tasks: Task[] = []
  newTask = repo(Task).create()
  titleCaption = repo(Task).metadata.fields.title.caption

  ngOnInit() {
    repo(Task)
      .find({
        limit: 7,
        orderBy: { title: 'asc' },
        where: { title: 'remult' }
      })
      .then(items => this.tasks = items)
  }

  async addTask() {
    const task = await repo(Task).insert(this.newTask)
    this.tasks.push(task)
    this.newTask = repo(Task).create()
  }
}`,
    },
    {
      name: 'todo.component.html',
      keyContext: 'frontend2',
      framework: 'angular',
      languageCodeHighlight: 'html',
      content: `<form (ngSubmit)="addTask()">
  <label>{{titleCaption}}</label>
  <input [(ngModel)]="newTask.title" name="title" />
  <button type="submit">Add</button>
</form>

<div *ngFor="let task of tasks">
  {{task.title}}
</div>`,
    },
  ],
} satisfies CodeStepInput
