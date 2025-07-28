import { Entity, Fields, Validators } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: [
      Validators.minLength(2),
      Validators.maxLength(5, (length) => `maximum ${length} characters`),
    ],
  })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
