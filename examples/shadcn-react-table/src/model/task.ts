import { Entity, Fields, Validators } from 'remult'

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
  dbName: 'shadcn_tasks',
})
export class Task {
  @Fields.cuid()
  id = ''
  @Fields.string({ caption: 'Task', validate: Validators.unique })
  code = ''
  @Fields.string()
  title = ''
  @Fields.literal(() => statusOptions)
  status: Status = 'todo'
  @Fields.literal(() => labelOptions)
  label: Label = 'bug'
  @Fields.literal(() => priorityOptions)
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
