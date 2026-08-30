import type { RequestEvent } from '@sveltejs/kit'

import { Task } from '../../../shared/Task'
import { Product } from '../../../shared/Product'
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
  entities: [Task, Product, Gated],
  initApi: async () => {
    const { repo } = await import('remult')
    if ((await repo(Gated).count()) === 0)
      await repo(Gated).insert([
        { id: 1, pub: true, secret: 'public-row-secret' },
        { id: 2, pub: false, secret: 'TOP-SECRET' },
      ])
  },
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
  modules: [initRequestModule],
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}

export const { PUT, POST, DELETE, GET } = _api
