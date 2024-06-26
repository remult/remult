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
})
export class Task {
  @Fields.autoIncrement()
  id?: number
  @Fields.createdAt()
  createdAt = new Date()
  @Relations.toMany(() => ContactTag)
  tags?: ContactTag[]
}
