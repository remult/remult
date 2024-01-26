import { remultNuxt } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'

export const api = remultNuxt({
  entities: [Task],
  admin: true,
})

export default defineEventHandler(api)
