import { browser } from '$app/environment'
import { repo, withApiRules } from 'remult'
import { Gated } from '../../shared/Gated'
import type { PageLoad } from './$types'

// the same global repo() on both sides: on SSR the scope routes it through
// event.fetch, in the browser it already goes through the api
export const load = (async (event) => {
  const rows = await withApiRules(() => repo(Gated).find(), {
    fetch: event.fetch,
  })
  return {
    ...event.data,
    universal: rows.map((r) => `${r.id}:${r.secret ?? ''}`),
    ranOn: browser ? 'csr' : 'ssr',
  }
}) satisfies PageLoad
