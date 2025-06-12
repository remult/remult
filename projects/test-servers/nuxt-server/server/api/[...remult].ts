import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'
import { someRoutes } from '../../../shared/modules/someRoutes/server.js'

export const api = remultApi({
  entities: [Task],
  admin: true,
  modules: [someRoutes as any],
})

export default defineEventHandler(api)
