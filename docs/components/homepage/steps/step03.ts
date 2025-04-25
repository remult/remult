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
    repo(Task).find({/*...*/}).then((items) => (tasks = items))
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
