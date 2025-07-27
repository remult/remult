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
        .findId('27d24908-f417-4b0c-b98a-8946d661f0ce')
      // .findId(remult.user!.id) // We don't have a connected used today in admin.
    }
  },
  saved: async (_, { relations }) =>
    Contact.updateLastSeen((await relations.contact.findOne())!),
  deleted: async (_, { relations }) =>
    Contact.updateLastSeen((await relations.contact.findOne())!),
})
export class ContactNote {
  @Fields.id()
  id?: string
  @Fields.string({ dbName: 'contact' })
  contactId = ''
  @Relations.toOne<ContactNote, Contact>(() => Contact, 'contactId')
  contact?: Contact
  @Fields.string()
  text = ''
  @Field(() => AccountManager, { allowApiUpdate: false })
  accountManager!: AccountManager
  @Relations.toOne<ContactNote, AccountManager>(() => AccountManager, {
    allowApiUpdate: false,
    field: 'accountManager',
  })
  accountManagerInfo?: AccountManager
  @Fields.date()
  createdAt = new Date()
  @Field(() => Status)
  status = Status.cold
}
