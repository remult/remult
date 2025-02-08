import { Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: true,
  allowApiDelete: 'admin',
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
