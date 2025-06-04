import { type RequestEvent } from '@sveltejs/kit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import { remult } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { someRoutes } from '../../../shared/modules/someRoutes'

export const api = remultApi({
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
  initApi: (api) => {
    console.log('Ready 💪')
  },

  // TODO JYC: I need help to fix this!
  modules: [someRoutes],
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}
