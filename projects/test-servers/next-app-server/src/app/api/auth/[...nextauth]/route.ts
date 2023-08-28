import NextAuth, { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { UserInfo } from 'remult'

const validUsers: UserInfo[] = [
  { id: '1', name: 'Jane', roles: ['admin'] },
  { id: '2', name: 'Steve' },
]
export function getUserById(id: string | undefined) {
  return validUsers.find((user) => user.id === id)
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        name: {
          placeholder: 'Try Steve or Jane',
        },
      },
      authorize: (info) =>
        validUsers.find((user) => user.name === info?.name) || null,
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: getUserById(token?.sub),
    }),
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
