import { Entity, Fields, remult, ForbiddenError, Filter } from 'remult'

@Entity<Task>('tasks', {
  apiPrefilter: () => Task.allowedTasks(),
  allowApiCrud: true,
})
export class Task {
  @Fields.uuid()
  id = ''

  @Fields.string({ required: true })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date

  @Fields.string({ allowApiUpdate: false })
  ownerId = remult.user?.id || ''

  // Custom Filter for Task Permissions
  static allowedTasks = Filter.createCustom<Task>(() => {
    if (remult.isAllowed('admin')) return {}
    else if (remult.authenticated()) return { ownerId: remult.user!.id }
    throw new ForbiddenError()
  })
}
