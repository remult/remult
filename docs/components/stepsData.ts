export interface CodeStep {
  id: string
  name: string
  files: {
    name: string
    content: string
    keyContext: string // So that we can just from a framework to another framework keeping the context
    framework?: 'svelte' | 'vue' | 'react' | 'angular' // default is nothing
  }[]
  cta?: {
    label: string
    href: string
  }[]
}

export const stepsData: CodeStep[] = [
  {
    id: '0-step1',
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
        content: `PLOP... react content...`,
      },
      {
        name: '+page.svelte',
        keyContext: 'frontend',
        framework: 'svelte',
        content: `$effect(() => {
  repo(Task)
    .find(
      { limit: 20 } 
    )
    .then((t) => (tasks = t));
});`,
      },
      {
        name: 'page.vue???',
        keyContext: 'frontend',
        framework: 'vue',
        content: `PLOP... vue content...`,
      },
      {
        name: 'page.angular???',
        keyContext: 'frontend',
        framework: 'angular',
        content: `PLOP... angular content...`,
      },
    ],
  },
]
