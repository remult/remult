import { remultApi } from 'remult/remult-nuxt'
import { Task } from '../../../shared/modules/task/Task.js'
import { someRoutes } from '../../../shared/modules/someRoutes/server.js'
import type { Module } from 'remult/server'

export const api = remultApi({
  entities: [Task],
  admin: true,
  modules: [someRoutes as Module<any>],
})

export default defineEventHandler(api)
