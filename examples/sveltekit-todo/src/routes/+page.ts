import { browser } from '$app/environment'
import { withFetch } from 'remult'
import { Task } from '../shared/Task'
import type { PageLoad } from './$types'

// Universal load: runs on the server for SSR, again in the browser on hydration
// (event.fetch replays the SSR response, no second request) and on client-side
// navigation. Use the remult the callback hands you: in the browser there is no
// async context, so the global remult is not scoped.
export const load = (async (event) => {
  const tasks = await withFetch(event.fetch, (remult) => remult.repo(Task).find())
  const ranOn = browser ? 'csr' : 'ssr'
  console.log(`[+page.ts] ${ranOn}: ${tasks.length} tasks via event.fetch`)
  return { ...event.data, tasks, ranOn }
}) satisfies PageLoad
