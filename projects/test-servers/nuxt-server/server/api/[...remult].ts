import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/Task.js'
import { Module } from 'remult/server'
import { remult } from 'remult'

export const initRequestModule = new Module({
  key: 'init-request-module',
  async initRequest() {
    if (remult.context.headers?.get('remult-test-crash-ctx') === 'yes-c') {
      throw new Error('test crash')
    }
  },
})

export const api = remultApi({
  entities: [Task],
  admin: true,
  modules: [initRequestModule as any],
})

export default defineEventHandler(api)
