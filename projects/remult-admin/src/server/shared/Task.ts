import {
  Allow,
  BackendMethod,
  Entity,
  Fields,
  Relations,
  Validators,
  remult,
} from '../../../../core/index.js'
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
  @Relations.toMany(() => ContactTag)
  tags?: ContactTag[]
}
