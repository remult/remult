import { browser } from '$app/environment'
import { withFetch } from 'remult'
import { Gated } from '../../shared/Gated'
import type { PageLoad } from './$types'

// use the callback's remult: in the browser there is no async context, so the
// global remult is not scoped there
export const load = (async (event) => {
  const rows = await withFetch(event.fetch, (remult) =>
    remult.repo(Gated).find(),
  )
  return {
    ...event.data,
    universal: rows.map((r) => `${r.id}:${r.secret ?? ''}`),
    ranOn: browser ? 'csr' : 'ssr',
  }
}) satisfies PageLoad
