import { Entity, Field, Fields, Validators } from 'remult'
import { capitalize } from '../lib/utils.ts'
import { statusOptions, type Status } from './status.ts'
import { labelOptions, type Label } from './label.ts'
import { Priority } from './priority.ts'

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
      // Generate a unique code for the task
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
  @Fields.literal(() => labelOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  label: Label = 'bug'

  @Fields.literal(() => statusOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  status: Status = 'todo'

  @Field(() => Priority, {
    validate: Validators.required,
  })
  priority = Priority.low

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
