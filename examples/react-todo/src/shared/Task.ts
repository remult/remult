import { Allow, Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string<Task>({
    validate: (task) => {
      if (task.title.length < 3) throw 'Too Short'
    },
    allowApiUpdate: 'admin',
  })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
