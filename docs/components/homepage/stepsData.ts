import { Language } from './Code.vue'
import type { Framework } from './composables/useUserPreference.js'

export interface CodeStepInput {
  name: string
  stepTime?: number // default is 1 minute
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

export type CodeStep = ReturnType<typeof codeStep>

const codeStep = (input: CodeStepInput) => {
  return {
    id: input.name.toLowerCase().replace(/ /g, '-'),
    stepTime: input.stepTime ?? 1 * 60,
    ...input,
  }
}

import step01 from './steps/step01.js'
import step02 from './steps/step02.js'
import step03 from './steps/step03.js'
import step04 from './steps/step04.js'
import step05 from './steps/step05.js'
import step06 from './steps/step06.js'
import step07 from './steps/step07.js'
import step08 from './steps/step08.js'
import step09 from './steps/step09.js'
import step10 from './steps/step10.js'
export const stepsData = [
  step01,
  step02,
  step03,
  step04,
  step05,
  step06,
  step07,
  step08,
  step09,
  step10,
].map((c) => codeStep(c))
