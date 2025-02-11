import { remultNuxt } from '../../../../core/remult-nuxt.js'
import { Task } from '~/shared/Task.js'
import { someRoutes } from '../../../shared/modules/someRoutes.js'

export const api = remultNuxt({
  entities: [Task],
  admin: true,
  modules: [someRoutes],
})

export default defineEventHandler(api)
