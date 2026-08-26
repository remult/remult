import { repo, withFetch } from 'remult'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import type { PageServerLoad } from './$types'

export const load = (async (event) => {
  // privileged: straight to the database, every field, allowed is not checked
  const [fromDb, directCount] = await Promise.all([
    repo(Task).find(),
    TasksController.countAll(),
  ])

  // api level: through the api as the current user, so includeInApi, allowApi*
  // and allowed apply. Same global repo() and BackendMethod, scoped by withFetch.
  const [fromApi, apiCount] = await withFetch(event.fetch, () =>
    Promise.all([
      repo(Task).find(),
      TasksController.countAll().catch(() => '(forbidden)'),
    ]),
  )

  const names = (tasks: Task[]) => tasks.map((t) => t.createdBy ?? '(hidden)')
  console.log('[+page.server.ts] createdBy from db:', names(fromDb), 'via api:', names(fromApi))
  console.log('[+page.server.ts] countAll direct:', directCount, 'via api:', apiCount)
  return { fromDb: names(fromDb), fromApi: names(fromApi), directCount, apiCount }
}) satisfies PageServerLoad
