import {
  Allow,
  BackendMethod,
  Entity,
  Fields,
  Relations,
  Validators,
  remult,
} from '../../../../../core/index.js'
import { Contact } from './Contact.entity'
import { Tag } from './Tag.entity'

@Entity<ContactTag>('contactTag', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  id: { contactId: true, tag: true },
})
export class ContactTag {
  @Fields.string({ dbName: 'contact' })
  contactId = ''
  @Relations.toOne<ContactTag, Contact>(() => Contact, 'contactId')
  contact!: Contact

  @Relations.toOne(() => Tag, {
    defaultIncluded: true,
  })
  tag!: Tag
}
