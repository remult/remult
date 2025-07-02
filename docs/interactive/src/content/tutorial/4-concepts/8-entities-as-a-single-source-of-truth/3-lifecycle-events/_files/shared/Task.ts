import { Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
  saving: async (task, e) => {
    if (e.isNew) console.log('- New task:', task.title)
    else {
      console.log('- Task updated:', task.title)
      for (const field of e.fields) {
        if (field.valueChanged())
          console.log(
            `  Field ${field.metadata.label} changed from ${field.originalValue} to ${field.value}`,
          )
      }
    }
  },
  deleting: async (task) => {
    console.log('- Task deleted:', task.title)
  },
})
export class Task {
  @Fields.uuid()
  id = ''

  @Fields.string({
    required: true,
  })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
