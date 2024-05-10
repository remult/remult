import { getServerSession } from 'next-auth'
import { UserInfo } from 'remult'
import { remultNextApp } from 'remult/remult-next'
import { Task } from '../../../shared/task'
import { authOptions } from '../auth/[...nextauth]/auth'

export const api = remultNextApp({
  entities: [Task],
  admin: true,
  // using next auth experimental version based on: https://codevoweb.com/setup-and-use-nextauth-in-nextjs-13-app-directory/
  getUser: async () => {
    return (await getServerSession(authOptions))?.user as UserInfo
  },
})
