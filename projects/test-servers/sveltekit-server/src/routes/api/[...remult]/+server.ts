import type { RequestEvent } from '@sveltejs/kit'

import { Task } from '../../../shared/Task'
import { TasksController } from '../../../shared/TasksController'
import { remult } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { createD1DataProvider, D1BindingClient, D1DataProvider } from "remult/remult-d1"
import { SqlDatabase } from 'remult'
import { Miniflare } from 'miniflare'

const mf = new Miniflare({
  scriptPath: 'src/cf-worker/index.ts',
  d1Databases: {
    DB: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
});
const db = await mf.getD1Database("DB");
const dataProvider = new SqlDatabase(new D1DataProvider(new D1BindingClient(db)))

export const _api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  admin: true,
  dataProvider,
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
