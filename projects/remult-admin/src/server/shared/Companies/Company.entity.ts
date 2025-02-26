import { Entity, Field, Fields, Relations } from '../../../../../core/index.js'
import { AccountManager } from '../AccountManagers/AccountManager.entity'
import { CompanySize } from './CompanySize'
import { Contact } from '../Contacts/Contact.entity'
import { Deal } from '../Deals/Deal.entity'

@Entity('companies', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  allowApiDelete: false,
  defaultOrderBy: { name: 'asc' },
})
export class Company {
  @Fields.uuid()
  id?: string
  @Fields.string()
  name = ''
  @Fields.string()
  logo = ''
  @Fields.string()
  sector = ''
  @Field(() => CompanySize)
  size = CompanySize.s1
  @Fields.string({ inputType: 'color' })
  color = '#0099FF'
  @Fields.string()
  linkedIn = ''
  @Fields.string()
  website = ''
  @Fields.string()
  phoneNumber = ''
  @Fields.string()
  address = ''
  @Fields.string()
  zipcode = ''
  @Fields.string()
  city = ''
  @Fields.string()
  stateAbbr = ''
  @Relations.toOne(() => AccountManager)
  accountManager?: AccountManager
  @Fields.date({ allowApiUpdate: false })
  createdAt = new Date()
  @Relations.toMany(() => Contact)
  contacts?: Contact[]
  @Relations.toMany<Company, Contact>(() => Contact, {
    findOptions: { where: { hasNewsletter: true } },
  })
  contactsWithNewsletter?: Contact[]
  @Relations.toMany(() => Deal)
  deals?: Deal[]
}
