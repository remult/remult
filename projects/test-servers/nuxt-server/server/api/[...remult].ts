import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'
import { initRequestModule } from '../../../../test-servers/shared/modules/initRequest/server.js'

export const api = remultApi({
  entities: [Task],
  admin: true,
  modules: [initRequestModule as any],
})

export default defineEventHandler(api)
