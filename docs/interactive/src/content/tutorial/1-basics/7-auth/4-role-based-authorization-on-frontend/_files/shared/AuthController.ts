import { BackendMethod, remult } from 'remult'
import type express from 'express'
import type from 'cookie-session'

declare module 'remult' {
  export interface RemultContext {
    request?: express.Request
  }
}

const validUsers = [
  {
    name: 'Jane',
    admin: true,
  },
  { name: 'Alex' },
]

export class AuthController {
  @BackendMethod({ allowed: true })
  static async signIn(name: string) {
    const user = validUsers.find((user) => user.name === name)
    if (user) {
      remult.user = {
        id: user.name,
        name: user.name,
        roles: user.admin ? ['admin'] : [],
      }
      remult.context.request!.session!['user'] = remult.user
      return remult.user
    } else {
      throw Error("Invalid user, try 'Alex' or 'Jane'")
    }
  }

  @BackendMethod({ allowed: true })
  static async signOut() {
    remult.context.request!.session!['user'] = undefined
    return undefined
  }
}
