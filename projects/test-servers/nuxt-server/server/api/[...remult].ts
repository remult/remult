import { remultNuxt } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'
import { someRoutes } from '../../shared/modules/someRoutes.js'

export const api = remultNuxt({
  entities: [Task],
  admin: true,
  modules: [someRoutes],
})

export default defineEventHandler(api)
