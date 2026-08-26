import { repo, withFetch } from 'remult'
import { Gated } from '../../shared/Gated'
import { Task } from '../../shared/Task'
import type { PageServerLoad } from './$types'

const show = (rows: Gated[]) => rows.map((r) => `${r.id}:${r.secret ?? ''}`)

export const load = (async (event) => {
  if ((await repo(Gated).count()) === 0)
    await repo(Gated).insert([
      { id: 1, pub: true, secret: 's1' },
      { id: 2, pub: false, secret: 's2' },
    ])

  // privileged: the database, every row and field, allowed not checked
  const fromDb = show(await repo(Gated).find())
  await Task.testForbidden()

  // api level: through event.fetch as the caller, so apiPrefilter,
  // includeInApi and allowed apply. Same global repo() and BackendMethod.
  const fromApi = await withFetch(event.fetch, async () =>
    show(await repo(Gated).find()),
  )
  const forbidden = await withFetch(event.fetch, async () =>
    Task.testForbidden(),
  ).then(
    () => 'ran',
    (e) => e.status,
  )
  return { fromDb, fromApi, forbidden }
}) satisfies PageServerLoad
