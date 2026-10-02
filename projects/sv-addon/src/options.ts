import { defineAddonOptions } from 'sv'

export const FEATURES = [
  { value: 'crud', label: 'CRUD demo', hint: 'Task entity + live list, validation, optimistic UI' },
  { value: 'auth', label: 'Auth + login-as', hint: 'users, roles, cookie session, impersonation' },
  { value: 'admin', label: 'Remult Admin', hint: 'auto-generated data browser at /api/admin' },
  { value: 'internal', label: 'Internal pages', hint: '/internal: users, crons, mails, SQL console' },
  { value: 'onboarding', label: 'Onboarding checklist', hint: 'always-visible live TODO panel' },
  { value: 'ai', label: 'AI skills', hint: 'AGENTS.md + remult & firstly skills for your agent' },
] as const

export type Feature = (typeof FEATURES)[number]['value']

export const options = defineAddonOptions()
  .add('preset', {
    question: 'How much remult do you want?',
    type: 'select',
    default: 'full',
    options: [
      { value: 'full', label: '🤯 Blow my mind', hint: 'the whole opinionated stack, batteries included' },
      { value: 'pick', label: '🎛️  Let me pick', hint: 'feature by feature' },
    ],
  })
  .add('firstly', {
    question: 'Add firstly (opinionated remult layer: reactive ff, toasts, dialogs, sql admin)?',
    type: 'boolean',
    default: true,
    condition: (o) => o.preset === 'pick',
  })
  .add('features', {
    question: 'What should be in the box?',
    type: 'multiselect',
    required: false,
    default: FEATURES.map((f) => f.value),
    options: FEATURES.map((f) => ({ ...f })),
    condition: (o) => o.preset === 'pick',
  })
  .build()
