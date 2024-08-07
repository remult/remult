import { Entity, Fields, remult } from 'remult'

@Entity('tasks', {
  allowApiCrud: true, // <-- Change this line
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
