import { repo, withFetch } from 'remult'
import { Task } from '../shared/Task'
import type { PageServerLoad } from './$types'

export const load = (async (event) => {
  // privileged: straight to the database, every field, no api rule
  const fromDb = await repo(Task).find()
  // api level: through the api as the current user, so includeInApi,
  // allowApi* and apiPrefilter apply. Same global repo(), scoped by withFetch.
  const fromApi = await withFetch(event.fetch, () => repo(Task).find())
  // plain objects: toJson would apply includeInApi again for the current user
  const pick = (t: Task) => ({ id: t.id, title: t.title, ownerId: t.ownerId })
  return { fromDb: fromDb.map(pick), fromApi: fromApi.map(pick) }
}) satisfies PageServerLoad
