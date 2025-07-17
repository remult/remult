import type { RequestEvent } from '@sveltejs/kit'

import { Task } from '../../../shared/Task'
import { TasksController } from '../../../shared/TasksController'
import { remult } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { Module } from 'remult/server'
import { someRoutes } from '../../../../../shared/modules/someRoutes/server.js'

const initRequestModule = new Module({
  key: 'init-request-module-next',
  async initRequest() {
    if (remult.context.headers?.getAll()['remult-test-crash-ctx'] === 'yes-c') {
      throw new Error('test crash')
    }
  },
})

export const _api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  admin: true,
  initRequest: async (event) => {
    remult.context.setHeaders = (headers) => {
      event.setHeaders(headers)
    }
    remult.context.setCookie = (name, value) => {
      event.cookies.set(name, value, { path: '.' })
    }
  },
  modules: [initRequestModule, someRoutes as any],
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}

export const { PUT, POST, DELETE, GET } = _api
