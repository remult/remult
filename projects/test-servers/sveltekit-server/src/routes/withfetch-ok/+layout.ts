import { repo } from 'remult'
import { withFetch } from 'remult/internals'
import { Task } from '../../shared/Task'
import type { LayoutLoad } from './$types'

export const load = (async (event) => {
  const tasks = await withFetch(event.fetch, async () => {
    // imagine the layout awaits something first (auth check, parent(), ...)
    await new Promise((r) => setTimeout(r, 30))
    return repo(Task).find()
  })
  return { taskCount: tasks.length, layoutRanAt: Date.now() }
}) satisfies LayoutLoad
