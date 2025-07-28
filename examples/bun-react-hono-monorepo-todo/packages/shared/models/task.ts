import { Allow, Entity, Fields, Validators } from 'remult'

@Entity('tasks', {
  allowApiCrud: false,
  allowApiRead: Allow.authenticated,
  allowApiInsert: 'admin',
  allowApiDelete: 'admin',
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string({
    validate: Validators.required(),
    allowApiUpdate: 'admin',
  })
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
