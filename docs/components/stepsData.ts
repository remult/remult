import { Language } from './Code.vue'
import type { Framework } from './composables/useUserPreference.js'

export interface CodeStep {
  id: string
  name: string
  stepTime: number
  files: {
    name: string
    content: string
    keyContext: string // So that we can just from a framework to another framework keeping the context
    framework?: Framework // default is undefined
    languageCodeHighlight?: Language // default is typescript
    changed?: boolean // default is false
  }[]
  cta?: {
    label: string
    href: string
    highlight?: boolean // default is false
  }[]
}
