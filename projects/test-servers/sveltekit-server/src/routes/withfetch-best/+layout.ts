import { Remult, RestDataProvider } from 'remult'
import { Task } from '../../shared/Task'
import type { LayoutLoad } from './$types'

// a repo bound to THIS load's event.fetch - no global state, no scope, no leak
const apiRepo = (fetch: typeof globalThis.fetch) =>
  new Remult(new RestDataProvider(() => ({ httpClient: fetch, url: '/api' })))
    .repo

export const load = (async (event) => {
  const repo = apiRepo(event.fetch)
  const tasks = await repo(Task).find()
  return { taskCount: tasks.length, layoutRanAt: Date.now() }
}) satisfies LayoutLoad
