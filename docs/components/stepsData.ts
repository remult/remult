import { Language } from './Code.vue'
import type { Framework } from './composables/useUserPreference.js'
import { step01 } from './steps/step01.js'
import { step02 } from './steps/step02.js'
import { step03 } from './steps/step03.js'
import { step04 } from './steps/step04.js'

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
  }[]
}

export const stepsData: CodeStep[] = [step01, step02, step03, step04]
