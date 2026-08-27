import { repo, withApiRules } from 'remult'
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

  // api rules, in process - no fetch, no roundtrip, same global repo()
  const inProcess = await withApiRules(async () => show(await repo(Gated).find()))
  const status = (e: any) => e.httpStatusCode ?? e.status ?? `no status: ${JSON.stringify(e)}`
  const forbidden = await withApiRules(() => Task.testForbidden()).then(
    () => 'ran',
    status,
  )
  const forbiddenViaFetch = await withApiRules(() => Task.testForbidden(), {
    fetch: event.fetch,
  }).then(() => 'ran', status)

  // api rules through SvelteKit's fetch
  const viaFetch = await withApiRules(
    async () => show(await repo(Gated).find()),
    { fetch: event.fetch },
  )

  return { fromDb, inProcess, viaFetch, forbidden, forbiddenViaFetch }
}) satisfies PageServerLoad
