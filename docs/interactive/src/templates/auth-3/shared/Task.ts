import { Entity, Fields, remult } from 'remult'

@Entity('tasks', {
  allowApiCrud: remult.authenticated,
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
