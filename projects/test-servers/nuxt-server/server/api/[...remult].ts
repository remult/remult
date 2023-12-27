import { remultNuxt } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'

export const api = remultNuxt({
  entities: [Task],
})

export default defineEventHandler(api)
