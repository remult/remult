import type { LayoutLoad } from './$types'

export const load = (async (event) => {
  return { ...event.data }
}) satisfies LayoutLoad
