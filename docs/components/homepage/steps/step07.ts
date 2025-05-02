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
      content: previousStep.files
        .find((c) => c.name === 'page.tsx')!
        .content.replace('// [!code ++]', ''),
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
      content: previousStep.files
        .find((c) => c.name === 'page.vue')!
        .content.replace('// [!code ++]', ''),
    },
    {
      name: 'todo.cmp.ts',
      keyContext: 'frontend',
      framework: 'angular',
      languageCodeHighlight: 'angular-ts',
      content: previousStep.files
        .find((c) => c.name === 'todo.cmp.ts')!
        .content.replace('// [!code ++]', ''),
    },
    {
      name: 'todo.cmp.html',
      keyContext: 'frontend2',
      framework: 'angular',
      languageCodeHighlight: 'html',
      content: previousStep.files
        .find((c) => c.name === 'todo.cmp.html')!
        .content.replace('// [!code ++]', ''),
    },
  ],
} satisfies CodeStepInput
