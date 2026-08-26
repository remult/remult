import { browser } from '$app/environment'
import { withFetch } from 'remult'
import { Task } from '../shared/Task'
import type { PageLoad } from './$types'

// use the callback's remult: in the browser there is no async context, so the
// global remult is not scoped there
export const load = (async (event) => {
  const tasks = await withFetch(event.fetch, (remult) => remult.repo(Task).find())
  const ranOn = browser ? 'csr' : 'ssr'
  console.log(`[+page.ts] ${ranOn}: ${tasks.length} tasks via event.fetch`)
  return { ...event.data, tasks, ranOn }
}) satisfies PageLoad
