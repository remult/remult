import type { RequestEvent } from '@sveltejs/kit'

import { Task } from '../../../shared/Task'
import { Gated } from '../../../shared/Gated'
import { TasksController } from '../../../shared/TasksController'
import { remult } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { Module } from 'remult/server'

const initRequestModule = new Module({
  key: 'init-request-module-next',
  async initRequest() {
    if (remult.context.headers?.getAll()['remult-test-crash-ctx'] === 'yes-c') {
      throw new Error('test crash')
    }
  },
})

export const _api = remultApi({
  entities: [Task, Gated],
  controllers: [TasksController],
  admin: true,
  getUser: async (event) => {
    const auth = event.request.headers.get('authorization')
    if (auth === 'Bearer admin') return { id: 'admin', roles: ['admin'] }
    if (auth === 'Bearer user') return { id: 'user' }
    return undefined
  },
  initRequest: async (event) => {
    remult.context.setHeaders = (headers) => {
      event.setHeaders(headers)
    }
    remult.context.setCookie = (name, value) => {
      event.cookies.set(name, value, { path: '.' })
    }
  },
  modules: [initRequestModule],
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}

export const { PUT, POST, DELETE, GET } = _api
