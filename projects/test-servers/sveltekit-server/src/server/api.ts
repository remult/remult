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
  // OLD APPROACH - Framework-specific initialization (no longer needed!)
  // initRequest: async (event) => {
  //   remult.context.setHeaders = (headers) => {
  //     event.setHeaders(headers)
  //   }
  //   remult.context.setCookie = (name, value) => {
  //     event.cookies.set(name, value, { path: '.' })
  //   }
  // },
  initApi: (api) => {
    console.log('Ready 💪')
    console.log('🍪 Response methods now available via remult.res in backend methods!')
    console.log('📋 Available methods: setCookie, getCookie, deleteCookie, setHeaders, redirect, status, json, send, end')
  },

  // ✅ Modules work seamlessly with framework-agnostic remult.res approach!
  modules: [someRoutes],
})

// declare module 'remult' {
//   export interface RemultContext {
//     setHeaders(headers: Record<string, string>): void
//     setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
//   }
// }
