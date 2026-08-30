import { Remult, RestDataProvider } from 'remult'
import { Product } from '../../shared/Product'
import { Gated } from '../../shared/Gated'
import type { PageLoad } from './$types'

const apiRepo = (fetch: typeof globalThis.fetch) =>
  new Remult(new RestDataProvider(() => ({ httpClient: fetch, url: '/api' })))
    .repo

export const load = (async (event) => {
  const repo = apiRepo(event.fetch)
  const products = await repo(Product).find()
  const gated = await repo(Gated).find()
  return {
    productCount: products.length,
    pageRanAt: Date.now(),
    gated: gated.map((g) => ({ id: g.id, secret: g.secret })),
  }
}) satisfies PageLoad
