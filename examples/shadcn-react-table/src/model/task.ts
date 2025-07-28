import { Entity, Fields, Validators, remult } from 'remult'
import { capitalize } from '../lib/utils.ts'
import { statusOptions, type Status } from './status.ts'
import { labelOptions, type Label } from './label.ts'
import { priorityOptions, type Priority } from './priority.ts'

@Entity<Task>('tasks', {
  allowApiCrud: true,
  // * Role based operations:
  // allowApiDelete:"admin"

  // * Prefiltering data based on user role
  // apiPrefilter: () => {
  //   if (remult.isAllowed('admin')) return {}
  //   return { createdBy: remult.user!.id }
  // },
})
export class Task {
  @Fields.id()
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

  @Fields.literal(() => priorityOptions, {
    validate: Validators.required,
    displayValue: (_, value) => capitalize(value),
  })
  priority: Priority = 'low'

  @Fields.date({
    dbName: 'created_at',
    allowApiUpdate: false, // no one should be able to update this field
    displayValue: (_, value) => value?.toLocaleDateString(),
  })
  createdAt = new Date()

  @Fields.updatedAt({
    dbName: 'updated_at',
  })
  updatedAt = new Date()

  @Fields.string({
    includeInApi: 'admin',
    allowApiUpdate: false,
  })
  createdBy = remult.user?.id
}
