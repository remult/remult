import { repo, withFetch } from 'remult'
import { Task } from '../shared/Task'
import type { PageServerLoad } from './$types'

export const load = (async (event) => {
  // privileged: straight to the database, every field, no api rule
  const fromDb = await repo(Task).find()
  // api level: through the api as the current user, so includeInApi,
  // allowApi* and apiPrefilter apply. Same global repo(), scoped by withFetch.
  const fromApi = await withFetch(event.fetch, () => repo(Task).find())

  const names = (tasks: Task[]) => tasks.map((t) => t.createdBy ?? '(hidden)')
  console.log('createdBy from db:', names(fromDb), 'via api:', names(fromApi))
  return { fromDb: names(fromDb), fromApi: names(fromApi) }
}) satisfies PageServerLoad
