import { Entity, Fields, remult, getEntityRef } from 'remult'

@Entity('tasks', {
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

  @Fields.createdAt()
  createdAt?: Date

  @Fields.string({
    allowApiUpdate: false,
  })
  ownerId = remult.user?.id || ''
}
