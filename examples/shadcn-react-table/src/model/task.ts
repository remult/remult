import { Entity, Fields, Validators } from 'remult'
import { capitalize } from '../lib/utils.ts'

export const statusOptions = [
  'todo',
  'in-progress',
  'done',
  'canceled',
] as const
export type Status = (typeof statusOptions)[number]

export const labelOptions = [
  'bug',
  'feature',
  'enhancement',
  'documentation',
] as const
export type Label = (typeof labelOptions)[number]

export const priorityOptions = ['low', 'medium', 'high'] as const
export type Priority = (typeof priorityOptions)[number]

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id = ''
  @Fields.string<Task>({
    caption: 'Task',
    validate: Validators.unique,
    allowApiUpdate: false,
    saving: async (task, e) => {
      if (!task.code) {
        const maxTaskCodeRow = await e.entityRef.repository.findOne({
          orderBy: { code: 'desc' },
        })
        task.code = `TASK-${(
          parseInt(maxTaskCodeRow?.code?.split('-')[1] || '0') + 1
        )
          .toString()
          .padStart(4, '0')}`
      }
    },
  })
  code = ''
  @Fields.string({
    validate: Validators.required,
  })
  title = ''
  @Fields.literal(() => statusOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  status: Status = 'todo'
  @Fields.literal(() => labelOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  label: Label = 'bug'
  @Fields.literal(() => priorityOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  priority: Priority = 'low'
  @Fields.date({
    dbName: 'created_at',
    allowApiUpdate: false,
    displayValue: (_, value) => value?.toLocaleDateString(),
  })
  createdAt = new Date()
  @Fields.updatedAt({
    dbName: 'updated_at',
  })
  updatedAt = new Date()
}
