import {
  Allow,
  BackendMethod,
  Entity,
  Field,
  Fields,
  Relations,
  Validators,
  isBackend,
  remult,
} from '../../../../../core/index.js'
import { AccountManager } from '../AccountManagers/AccountManager.entity'
import { Contact } from './Contact.entity'
import { Status } from './Status'

@Entity<ContactNote>('contactNote', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  defaultOrderBy: {
    createdAt: 'desc',
  },
  saving: async (contactNote) => {
    if (isBackend()) {
      contactNote.accountManager = await remult
        .repo(AccountManager)
        .findId(remult.user!.id)
    }
  },
  saved: async (_, { relations }) =>
    Contact.updateLastSeen((await relations.contact.findOne())!),
  deleted: async (_, { relations }) =>
    Contact.updateLastSeen((await relations.contact.findOne())!),
})
export class ContactNote {
  @Fields.uuid()
  id?: string
  @Fields.string({ dbName: 'contact' })
  contactId = ''
  @Relations.toOne<ContactNote, Contact>(() => Contact, 'contactId')
  contact?: Contact
  @Fields.string()
  text = ''
  @Field(() => AccountManager, { allowApiUpdate: false })
  accountManager!: AccountManager
  @Fields.date()
  createdAt = new Date()
  @Field(() => Status)
  status = Status.cold
}
