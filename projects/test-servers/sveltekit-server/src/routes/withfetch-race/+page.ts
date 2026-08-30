import { repo } from 'remult'
import { withFetch } from 'remult/internals'
import { Product } from '../../shared/Product'
import type { PageLoad } from './$types'

export const load = (async (event) => {
  const products = await withFetch(event.fetch, async () => {
    // imagine the page awaits something first (auth check, another fetch, ...)
    await new Promise((r) => setTimeout(r, 30))
    return repo(Product).find()
  })
  return { productCount: products.length, pageRanAt: Date.now() }
}) satisfies PageLoad
