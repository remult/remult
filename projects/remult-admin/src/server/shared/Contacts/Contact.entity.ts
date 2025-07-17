import {
  Allow,
  BackendMethod,
  Entity,
  EntityFilter,
  Field,
  Fields,
  Filter,
  Relations,
  Validators,
  remult,
  repo,
} from '../../../../../core/index.js'
import { AccountManager } from '../AccountManagers/AccountManager.entity'
import { Company } from '../Companies/Company.entity'
import { Acquisition } from './Acquisition'
import { ContactNote } from './ContactNote.entity'
import { ContactTag } from './ContactTag.entity'
import { genderOptions } from './Gender'
import { Status } from './Status'
import { Tag } from './Tag.entity'

@Entity<Contact>('contacts', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  allowApiDelete: false,
  defaultOrderBy: {
    lastName: 'asc',
  },
  saving: (item) => {
    item.comp_p2 = 'part2'
  },
})
export class Contact {
  @Fields.uuid()
  id?: string
  @Fields.string<Contact>({
    validate: (task) => {
      if (task.lastName.length < 3) throw 'Must be at least 3 characters long'
    },
  })
  lastName = ''
  @Fields.string({
    validate: Validators.required,
  })
  firstName = ''
  @Fields.string<AccountManager>({
    serverExpression: (e) => e.firstName + ' ' + e.lastName,
  })
  fullName = ''
  @Fields.literal(() => genderOptions)
  gender = genderOptions
  @Fields.string()
  title = ''
  @Fields.string()
  companyId = ''
  @Fields.string()
  comp_p2 = ''
  @Relations.toOne<Contact, Company>(() => Company, {
    defaultIncluded: true,
    fields: {
      companyId: 'companyId',
      // companyIdPart2: 'comp_p2'
    },
  })
  company?: Company
  @Fields.string()
  phoneNumber1 = ''
  @Fields.string()
  phoneNumber2 = ''
  @Fields.string()
  background = ''
  @Field(() => Acquisition)
  acquisition = Acquisition.inbound
  @Fields.string()
  email = ''
  @Fields.string()
  avatar? = ''
  @Fields.boolean()
  hasNewsletter: boolean = false
  @Relations.toMany(() => ContactTag)
  tags?: ContactTag[]
  @Fields.string({ dbName: 'accountManager' })
  accountManagerId = ''
  @Relations.toOne<Contact, AccountManager>(
    () => AccountManager,
    'accountManagerId',
  )
  accountManager?: AccountManager
  @Field(() => Status)
  status = Status.cold
  @Fields.date({
    allowApiUpdate: false,
  })
  lastSeen = new Date()
  @Fields.date({
    allowApiUpdate: false,
  })
  createdAt = new Date()

  @Fields.integer<Contact>({
    allowApiUpdate: false,
    serverExpression: async (contact) =>
      remult.repo(Contact).relations(contact).notes.count(),
  })
  nbNotes = 0 //[ ] reconsider - maybe make server expression managed with include etc...

  @Relations.toMany(() => ContactNote)
  notes?: ContactNote[]

  static filterTag = Filter.createCustom<Contact, string>(async (tag) => {
    if (!tag) return {}
    const r: EntityFilter<Contact> = {
      id: await remult
        .repo(ContactTag)
        .find({
          where: {
            tag: await remult.repo(Tag).findFirst({ tag }),
          },
          load: (ct) => [],
        })
        .then((ct) => ct.map((ct) => ct.contactId)),
    }
    return r
  })
  static disableLastSeenUpdate = false
  static async updateLastSeen(contact: Contact) {
    if (Contact.disableLastSeenUpdate) return
    const last = await repo(Contact)
      .relations(contact)
      .notes.findFirst(
        {},
        {
          orderBy: {
            createdAt: 'desc',
          },
        },
      )

    contact.lastSeen = last?.createdAt
    await remult.repo(Contact).save(contact)
  }
}
