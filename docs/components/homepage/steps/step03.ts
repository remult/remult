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
      changed: true,
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `import { useEffect, useState } from 'react'
import { repo } from 'remult'
import { Task } from './entities'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("") // [!code ++]

  useEffect(() => {
    repo(Task).find({ /*...*/ }).then(setTasks)
  }, [])

  const addTask = async (e: FormEvent) => { // [!code ++]
    e.preventDefault() // [!code ++]
    const newTask = await repo(Task).insert({ title: newTaskTitle }) // [!code ++]
    setTasks([...tasks, newTask]) // [!code ++]
    setNewTaskTitle("") // [!code ++] 
  } // [!code ++]

  return (
    <div>
      <form onSubmit={addTask}> // [!code ++]
        <input // [!code ++]
          value={newTaskTitle} // [!code ++]
          onChange={e => setNewTaskTitle(e.target.value)} // [!code ++]
        /> // [!code ++]
        <button>Add</button> // [!code ++]
      </form> // [!code ++]
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
  let newTask = $state(repo(Task).create()) // set default values [!code ++]

  $effect(() => {
    repo(Task).find({ /*...*/ }).then((items) => (tasks = items))
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
      changed: true,
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { repo } from 'remult'
  import { Task } from './entities'

  const tasks = ref<Task[]>([])
  const newTask = ref(repo(Task).create()) // set default values [!code ++]
  
  onMounted(() => {
    repo(Task).find({ /* ... */ }).then((items) => (tasks.value = items))
  })

  async function addTask() { // [!code ++]
    const t = await repo(Task).insert(newTask.value) // [!code ++]
    tasks.value.push(t) // [!code ++]
    newTask.value = repo(Task).create() // reset the form [!code ++]
  } // [!code ++]
</script>

<template>
  <form @submit.prevent="addTask()"> // [!code ++]
    <input v-model="newTask.title" /> // [!code ++]
    <button>Add</button> // [!code ++]
  </form> // [!code ++]
  <div v-for="task in tasks">
    {{ task.title }}
  </div>
</template>`,
    },
    {
      name: 'todo.component.ts',
      keyContext: 'frontend',
      framework: 'angular',
      changed: true,
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
  newTask = repo(Task).create() // [!code ++]

  ngOnInit() {
    repo(Task).find({ /* ... */ }).then(items => this.tasks = items)
  }

  async addTask() { // [!code ++]
    const task = await repo(Task).insert(this.newTask) // [!code ++]
    this.tasks.push(task) // [!code ++]
    this.newTask = repo(Task).create() // [!code ++]
  } // [!code ++]
}`,
    },
    {
      name: 'todo.component.html',
      keyContext: 'frontend2',
      framework: 'angular',
      changed: true,
      languageCodeHighlight: 'html',
      content: `<form (ngSubmit)="addTask()"> // [!code ++]
  <input [(ngModel)]="newTask.title" name="title" /> // [!code ++]
  <button type="submit">Add</button> // [!code ++]
</form> // [!code ++]

<div *ngFor="let task of tasks">
  {{task.title}}
</div>`,
    },
  ],
} satisfies CodeStepInput
