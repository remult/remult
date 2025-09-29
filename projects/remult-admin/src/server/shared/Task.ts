import { Entity, Fields, Relations } from '../../../../core/index.js'
import { ContactTag } from './Contacts/ContactTag.entity.js'

@Entity<Task>('tasks', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  defaultOrderBy: {
    createdAt: 'desc',
  },
})
export class Task {
  @Fields.autoIncrement()
  id?: number
  @Fields.createdAt()
  createdAt = new Date()
  @Fields.string({ required: true })
  title = ''
  @Fields.boolean()
  done = false
  @Fields.dateOnly()
  remindeMeOn = new Date()
  @Relations.toMany(() => ContactTag)
  tags?: ContactTag[]
  @Fields.date({ allowNull: true })
  dueDate: Date | null = null
}
