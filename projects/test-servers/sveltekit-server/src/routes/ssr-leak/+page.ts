import { repo } from 'remult'
import { Gated } from '../../shared/Gated'
import type { PageLoad } from './$types'

// the naive universal load: same line, two meanings -
// on SSR it reads the DB directly (privileged!), in the browser it goes through the api
export const load = (async () => {
  const rows = await repo(Gated).find()
  return { rows: rows.map((r) => ({ id: r.id, pub: r.pub, secret: r.secret })) }
}) satisfies PageLoad
