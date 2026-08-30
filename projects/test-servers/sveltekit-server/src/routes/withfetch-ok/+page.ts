import { repo } from 'remult'
import { withFetch } from 'remult/internals'
import { Product } from '../../shared/Product'
import type { PageLoad } from './$types'

export const load = (async (event) => {
  // the only difference: wait for the layout load first - scopes never overlap
  await event.parent()

  const products = await withFetch(event.fetch, async () => {
    const p = await repo(Product).find()
    await new Promise((r) => setTimeout(r, 80))
    return p
  })
  return { productCount: products.length, pageRanAt: Date.now() }
}) satisfies PageLoad
