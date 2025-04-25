import type { CodeStepInput } from '../stepsData.js'
import previousStep from './step06.js'

export default {
  name: 'Add hooks',
  cta: [
    {
      label: 'All lifecycle hooks',
      href: '/lifecycle-hooks',
    },
  ],
  files: [
    {
      name: 'entities.ts',
      keyContext: 'backend',
      changed: true,
      content: `import { Entity, Fields, Validators, Allow } from 'remult'

@Entity<Task>('tasks', {
  allowApiRead: true,
  allowApiInsert: Allow.authenticated, 
  allowApiUpdate: "admin",
  allowApiDelete: false, 

  saving: (item) => {// [!code ++]
    item.createdBy = remult.user.id // [!code ++]
  }, // [!code ++]
  saved: (item, e) => {// [!code ++]
    if(e.isNew)  { /* send an email */ } // [!code ++]   
  }// [!code ++]
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.string({
    caption: 'Title of the task',
    validate: Validators.required 
  })
  title = ''

  @Fields.string() // [!code ++]
  createdBy = '' // [!code ++]
}`,
    },
    {
      name: 'page.tsx',
      keyContext: 'frontend',
      framework: 'react',
      languageCodeHighlight: 'tsx',
      content: `TODO`,
    },
    {
      name: '+page.svelte',
      keyContext: 'frontend',
      framework: 'svelte',
      languageCodeHighlight: 'svelte',
      content: previousStep.files
        .find((c) => c.name === '+page.svelte')!
        .content.replace('// [!code ++]', ''),
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
