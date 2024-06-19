import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { SvelteKitAuth } from '@auth/sveltekit'
import Credentials from '@auth/core/providers/credentials'
import { _api } from './routes/api/[...remult]/+server'
import type { UserInfo } from 'remult'

/**
 * Users that are allowed to log in.
 */
const validUsers: UserInfo[] = [
  { id: '1', name: 'Jane', roles: ['admin'] },
  { id: '2', name: 'Steve' },
]

/**
 * Handle authentication with authjs as an example
 * Based on article at https://authjs.dev/reference/sveltekit
 */
export const { handle: handleAuth } = SvelteKitAuth({
  trustHost: true,
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
      user: validUsers.find((user) => user.id === token?.sub),
    }),
  },
})

/**
 * Handle remult server side
 */
const handleRemult: Handle = async ({ event, resolve }) => {
  return await _api.withRemult(event, async () => await resolve(event))
}

export const handle = sequence(
  // 1. Handle authentication
  handleAuth,
  // 2. Handle remult server side
  handleRemult,
)
