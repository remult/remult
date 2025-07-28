import { Entity, Fields, Validators } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: (task) => task.title.length > 2 || 'too short',
  })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
