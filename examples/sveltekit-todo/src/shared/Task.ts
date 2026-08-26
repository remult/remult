import { Allow, Entity, Fields, remult } from 'remult'

@Entity<Task>('tasks', {
  allowApiCrud: Allow.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
  saving: (task, e) => {
    if (e.isNew) task.createdBy = remult.user?.name ?? ''
  },
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

  // only admins get it through the api, a privileged server read always does
  @Fields.string({ includeInApi: 'admin', allowApiUpdate: false })
  createdBy = ''
}
