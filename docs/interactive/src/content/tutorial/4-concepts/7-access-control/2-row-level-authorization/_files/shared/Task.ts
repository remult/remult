import { Entity, Fields, remult, getEntityRef } from 'remult'

@Entity<Task>('tasks', {
  allowApiRead: true,
  allowApiInsert: remult.authenticated,
  allowApiDelete: 'admin',
  allowApiUpdate: (task) =>
    remult.isAllowed('admin') || task.ownerId === remult.user?.id,
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

  @Fields.string({
    allowApiUpdate: false,
  })
  ownerId = remult.user?.id || ''
}
