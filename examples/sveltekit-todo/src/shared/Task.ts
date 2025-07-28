import { Allow, Entity, Fields } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
})
export class Task {
  @Fields.id()
  id!: string

  @Fields.string<Task>({
    validate: (task) => {
      if (task.title.length < 3)
        throw 'The title must be at least 3 characters long'
    },
    allowApiUpdate: 'admin',
  })
  title: string = ''

  @Fields.boolean()
  completed: boolean = false

  @Fields.createdAt()
  completedAt: Date = new Date()
}
