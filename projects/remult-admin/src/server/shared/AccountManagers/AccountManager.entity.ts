import {
  Allow,
  BackendMethod,
  Entity,
  Fields,
  Validators,
  remult,
} from '../../../../../core/index.js'

@Entity<AccountManager>('accountManagers', {
  // allowApiCrud: Allow.authenticated,
  allowApiCrud: true,
  allowApiDelete: false,
  defaultOrderBy: {
    firstName: 'asc',
    lastName: 'asc',
  },
})
export class AccountManager {
  @Fields.id()
  id?: string
  @Fields.string<AccountManager>({
    validate: Validators.required,
    includeInApi(e, c) {
      return e?.firstName.startsWith('A') || e?.firstName.startsWith('M')
        ? false
        : true
    },
  })
  firstName = ''
  @Fields.string()
  lastName = ''
  @Fields.string<AccountManager>({
    serverExpression: (e) => e.firstName + ' ' + e.lastName,
  })
  fullName = ''
  @Fields.string({ includeInApi: false })
  secret = '1234'
  @Fields.string()
  email = ''
  @Fields.string()
  avatar = ''

  @BackendMethod({ allowed: true })
  static async getValidUserName() {
    const allUsers = await remult.repo(AccountManager).find()
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
    return randomUser.firstName
  }
}

// declare module 'remult' {
//   export interface UserInfo {
//     avatar: string
//   }
// }
