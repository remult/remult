import { remultNuxt } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'

export default defineEventHandler(
  remultNuxt({
    entities: [Task],
  }),
)
