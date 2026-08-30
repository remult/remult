import { repo } from 'remult'
import { withFetch } from 'remult/internals'
import { Gated } from '../../shared/Gated'
import type { PageLoad } from './$types'

// the fix: on SSR the read goes through the api endpoint via event.fetch,
// so the api rules apply - same rows on SSR and in the browser
export const load = (async (event) => {
  const rows = await withFetch(event.fetch, () => repo(Gated).find())
  return { rows: rows.map((r) => ({ id: r.id, pub: r.pub, secret: r.secret })) }
}) satisfies PageLoad
