import { remult } from 'remult'
import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

// will protect every route in the app
export const load = (async () => {
  if (!remult.authenticated()) {
    throw redirect(303, '/auth/signin')
  }
  return {
    user: remult.user,
  }
}) satisfies LayoutServerLoad
