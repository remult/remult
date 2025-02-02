import { remultExpress } from '../../../core/remult-express'
import { AccountManager } from './shared/AccountManagers/AccountManager.entity.js'
import { Company } from './shared/Companies/Company.entity.js'
import { Contact } from './shared/Contacts/Contact.entity.js'
import { ContactNote } from './shared/Contacts/ContactNote.entity.js'
import { ContactTag } from './shared/Contacts/ContactTag.entity.js'
import { Tag } from './shared/Contacts/Tag.entity.js'
import { Deal, DealContact } from './shared/Deals/Deal.entity.js'
import { NoNo } from './shared/NoNo.js'
import { Story } from './shared/Story.js'
import { Task } from './shared/Task.js'

export const entities = [
  Company,
  Contact,
  ContactNote,
  Tag,
  ContactTag,
  DealContact,
  AccountManager,
  Deal,
  Task,
  NoNo,
  Story,
]

export const api = remultExpress({
  entities,
  admin: true,
})
