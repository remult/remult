import { Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
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
}
