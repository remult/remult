import { withFetch } from 'remult'
import { Task } from '../shared/Task'
import type { PageLoad } from './$types'

// Runs on the server (SSR) and in the browser. `event.fetch` carries the auth
// cookie, so the api rules of Task apply on both sides, and the browser reuses
// the SSR response instead of fetching again.
export const load = (async (event) => {
  const tasks = await withFetch(event.fetch, (remult) => remult.repo(Task).find())
  return { ...event.data, tasks }
}) satisfies PageLoad
