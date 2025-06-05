import type { RequestEvent } from '@sveltejs/kit'

import { Task } from '../../../shared/Task'
import { TasksController } from '../../../shared/TasksController'
import { remult } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { createD1DataProvider } from 'remult/remult-d1'
import { getPlatformProxy } from 'wrangler'

async function initDataProvider() {
  const { env } = await getPlatformProxy<{ DBRemult: D1Database }>()
  return createD1DataProvider(env.DBRemult)
}

export const _api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  admin: true,
  dataProvider: initDataProvider(),
  initRequest: async (event) => {
    remult.context.setHeaders = (headers) => {
      event.setHeaders(headers)
    }
    remult.context.setCookie = (name, value) => {
      event.cookies.set(name, value, { path: '.' })
    }
  },
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}

export const { PUT, POST, DELETE, GET } = _api
