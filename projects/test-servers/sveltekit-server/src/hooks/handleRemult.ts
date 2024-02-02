import type { RequestEvent } from '@sveltejs/kit'
// import { remultSveltekit } from '../../../../core/remult-sveltekit'
import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import { remult } from 'remult'

export const handleRemult = remultSveltekit({
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
})

declare module 'remult' {
  export interface RemultContext {
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
  }
}
