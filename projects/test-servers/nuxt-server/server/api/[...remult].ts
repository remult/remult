import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'

export const api = remultApi({
  entities: [Task],
  admin: true,
})

export default defineEventHandler(api)
