import type { UserInfo } from '../../../core/index.js'
import { remultApi } from '../../../core/remult-express'
import { AccountManager } from './shared/AccountManagers/AccountManager.entity.js'
import { AccountManagerExtra } from './shared/AccountManagers/AccountManagerExtra.entity.js'
import { Company } from './shared/Companies/Company.entity.js'
import { Contact } from './shared/Contacts/Contact.entity.js'
import { ContactNote } from './shared/Contacts/ContactNote.entity.js'
import { ContactTag } from './shared/Contacts/ContactTag.entity.js'
import { Tag } from './shared/Contacts/Tag.entity.js'
import { Deal, DealContact } from './shared/Deals/Deal.entity.js'
import { NoNo } from './shared/NoNo.js'
import { Story } from './shared/Story.js'
import { Task } from './shared/Task.js'

// demo users: the bearer token is the user
export const users: Record<string, UserInfo> = {
  admin: { id: 'admin', name: 'Admin', roles: ['admin'] },
  ops: { id: 'ops', name: 'Ops' },
}

export function bearerOf(req: { headers?: Record<string, unknown> }) {
  const h = req.headers?.['authorization']
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : ''
}

const hiddenForOps: unknown[] = [NoNo, Story, AccountManagerExtra]

export const entities = [
  Company,
  Contact,
  ContactNote,
  Tag,
  ContactTag,
  DealContact,
  AccountManagerExtra,
  AccountManager,
  Deal,
  Task,
  NoNo,
  Story,
]

export const api = remultApi({
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
  getUser: async (req) => {
    const token = bearerOf(req)
    return Object.hasOwn(users, token) ? users[token] : undefined
  },
  admin: {
    allow: true,
    customHtmlHead: (r) => `<title>Dev Admin (${
      r.user?.name ?? 'Anonymous'
    })</title>
<link href="https://remult.dev/favicon.png" rel="icon" type="image/png">`,
    requireAuthToken: true,
    entities: (entity, remult) => {
      if (remult.isAllowed('admin')) return true
      if (hiddenForOps.includes(entity.entityType)) return false
      if (entity.key === 'contacts')
        return { editMode: 'drawer', lockEditMode: true }
      return true
    },
    // disableLiveQuery: true,
  },
})
