export interface CodeStep {
  id: string
  name: string
  files: {
    name: string
    content: string
    type?: 'backend' | 'frontend' // default is backend
    framework?: 'svelte' | 'vue' | 'react' | 'angular' // default is nothing
  }[]
}

export const stepsData: CodeStep[] = [
  {
    id: '0-step1',
    name: 'Define a model',
    files: [
      {
        name: 'entity.ts',
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
        name: '+page.svelte',
        type: 'frontend',
        framework: 'svelte',
        content: `$effect(() => {
  repo(Task)
    .find(
      { limit: 20 } 
    )
    .then((t) => (tasks = t));
});`,
      },
    ],
  },
]
