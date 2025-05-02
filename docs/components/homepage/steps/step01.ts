import type { CodeStepInput } from '../stepsData.js'

export default {
  name: 'Define an entity',
  stepTime: 2 * 60,
  cta: [
    {
      label: 'Full Entity API',
      href: '/docs/ref_entity',
    }
  ],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      content: `import { Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string()
  title = ''
}`,
    },
    {
      name: 'api.ts',
      keyContext: 'init',
      content: `import { remultApi } from 'remult/remult-express' // or next, fastify, ...
import { createPostgresDataProvider } from 'remult/postgres' // or mongo, sqlite, mysql, ...

import { Task } from './entities'

export const api = remultApi({
  entities: [Task],
  dataProvider: createPostgresDataProvider()                
})`,
    },
    {
      name: 'page.tsx',
      keyContext: 'frontend',
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `import { useEffect, useState } from 'react'
import { repo } from 'remult'
import { Task } from './entities'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    repo(Task)
      .find()
      .then(setTasks)
  }, [])

  return (
    <div>
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
      framework: 'svelte',
      languageCodeHighlight: 'svelte',
      content: `<script lang="ts">
  import { repo } from 'remult'
  import { Task } from './entities'

  let tasks = $state<Task[]>([])

  $effect(() => {
    repo(Task)
      .find()
      .then((items) => (tasks = items))
  })
</script>

{#each tasks as task}
  <div>{task.title}</div>
{/each}`,
    },
    {
      name: 'page.vue',
      keyContext: 'frontend',
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { repo } from 'remult'
  import { Task } from './entities'

  const tasks = ref<Task[]>([])

  onMounted(() => {
    repo(Task)
      .find()
      .then((items) => (tasks.value = items))
  })
</script>

<template>
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
      content: `import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { repo } from 'remult'
import { Task } from './entities'

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.cmp.html'
})
export class TodoComponent implements OnInit {
  tasks: Task[] = []

  ngOnInit() {
    repo(Task)
      .find()
      .then(items => this.tasks = items)
  }
}`,
    },
    {
      name: 'todo.cmp.html',
      keyContext: 'frontend2',
      framework: 'angular',
      languageCodeHighlight: 'html',
      content: `<div *ngFor="let task of tasks">
  {{task.title}}
</div>`,
    },
  ],
} satisfies CodeStepInput
