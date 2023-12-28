import { NuxtAuthHandler } from '#auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserInfo } from 'remult'

const validUsers: UserInfo[] = [
  { id: '1', name: 'Jane', roles: ['admin'] },
  { id: '2', name: 'Steve' },
]
export function findUserById(id: string | undefined) {
  return validUsers.find((user) => user.id === id)
}

export default defineEventHandler(
  NuxtAuthHandler({
    providers: [
      CredentialsProvider.default({
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
        user: findUserById(token?.sub),
      }),
    },
  }),
)
