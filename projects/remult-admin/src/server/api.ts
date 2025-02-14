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
  // to dev "remult-admin":
  // - you should use http://localhost:5173/
  //   and it will server the api in /api
  // to test the result:
  // - you should "npm run build"
  //   you should use http://localhost:5173/api/admin.
  //   If you want to you can change the rootPath to "/api3"
  //   you should use http://localhost:5173/api3/admin.
  // rootPath: '/api3',
  entities,
  admin: true,
})
