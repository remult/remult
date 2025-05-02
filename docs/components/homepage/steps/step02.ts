import type { CodeStepInput } from '../stepsData.js'
import previousStep from './step01.js'

export default {
  name: 'Paging, Sorting, Filtering',
  cta: [
    {
      label: 'Advanced filtering',
      href: '/docs/custom-filter',
    },
    {
      label: 'Interactive tutorial: SQL Relations',
      href: 'https://learn.remult.dev/in-depth/4-filtering/4-sql-relations-filter',
    },
  ],
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

  useEffect(() => {
    repo(Task).find({
      limit: 7, // [!code ++]
      orderBy: { title: 'asc' }, // [!code ++]
      where: { title: 'remult' }, // [!code ++]
    }).then(setTasks)
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
      changed: true,
      framework: 'svelte',
      languageCodeHighlight: 'svelte',
      content: `<script lang="ts">
  import { repo } from 'remult'
  import { Task } from './entities'

  let tasks = $state<Task[]>([])

  $effect(() => {
    repo(Task)
      .find({
        limit: 7, // [!code ++]
        orderBy: { title: 'asc' }, // [!code ++]
        where: { title: 'remult' }, // [!code ++]
      })
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
      changed: true,
      framework: 'vue',
      languageCodeHighlight: 'vue',
      content: `<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { repo } from 'remult'
  import { Task } from './entities'

  const tasks = ref<Task[]>([])

  onMounted(() => {
    repo(Task)
      .find({
        limit: 7, // [!code ++]
        orderBy: { title: 'asc' }, // [!code ++]
        where: { title: 'remult' }, // [!code ++]
      }).then((items) => (tasks.value = items))
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
  templateUrl: './todo.cmp.html'
})
export class TodoComponent implements OnInit {
  tasks: Task[] = []

  ngOnInit() {
    repo(Task)
      .find({
        limit: 7, // [!code ++]
        orderBy: { title: 'asc' }, // [!code ++]
        where: { title: 'remult' }, // [!code ++]
      })
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
