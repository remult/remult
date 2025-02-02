import { Language } from './Code.vue'
import type { Framework } from './composables/useUserPreference.js'

export interface CodeStep {
  id: string
  name: string
  files: {
    name: string
    content: string
    keyContext: string // So that we can just from a framework to another framework keeping the context
    framework?: Framework // default is undefined
    languageCodeHighlight?: Language // default is typescript
  }[]
  cta?: {
    label: string
    href: string
  }[]
}

export const stepsData: CodeStep[] = [
  {
    id: 'step-01',
    name: 'Define a model',
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
        content: `import { useEffect, useState } from 'react'
import { remult } from 'remult'
import { Task } from './shared/Task'

const taskRepo = remult.repo(Task)

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    taskRepo.find().then(setTasks)
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
  import { repo } from "remult";
  import { Task } from "../shared/Task";

  let tasks = $state<Task[]>([]);

  $effect(() => {
    repo(Task)
      .find()
      .then((t) => (tasks = t));
  });
</script>

{#each tasks as task}
  {task.title}
{/each}`,
      },
      {
        name: 'page.vue',
        keyContext: 'frontend',
        framework: 'vue',
        languageCodeHighlight: 'vue',
        content: `<script setup lang="ts">
  import { onMounted, ref } from "vue";
  import { remult } from "remult";
  import { Task } from "./shared/Task";

  const taskRepo = remult.repo(Task);
  const tasks = ref<Task[]>([]);
  onMounted(() => taskRepo.find().then((items) => (tasks.value = items)));
</script>
<template>
  <main>
    <div v-for="task in tasks">
      {{ task.title }}
    </div>
  </main>
</template>`,
      },
      {
        name: 'todo.component.ts',
        keyContext: 'frontend',
        framework: 'angular',
        languageCodeHighlight: 'angular-ts',
        content: `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Task } from '../../shared/Task';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css',
})
export class TodoComponent {
  taskRepo = remult.repo(Task);
  tasks: Task[] = [];
  ngOnInit() {
    this.taskRepo.find().then((items) => (this.tasks = items));
  }
}`,
      },
      {
        name: 'todo.component.html',
        keyContext: 'frontend2',
        framework: 'angular',
        languageCodeHighlight: 'html',
        content: `<div *ngFor="let task of tasks">
  {{task.title}}
</div>`,
      },
    ],
  },

  {
    id: 'step-02',
    name: 'Step 2...',
    cta: [],
    files: [],
  },

  {
    id: 'step-03',
    name: 'Step 3...',
    cta: [],
    files: [],
  },
]
