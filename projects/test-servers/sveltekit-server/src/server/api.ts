import { remultApi } from 'remult/remult-sveltekit'
import { someRoutes } from '../../../shared/modules/someRoutes/server.js'
import { resBackendMethodModule } from '../../../shared/modules/resBackendMethod/server.js'
import { taskModule } from '../../../shared/modules/task/server.js'
import type { RequestEvent } from '@sveltejs/kit'
import type { Module } from 'remult/server'

export const api = remultApi({
  admin: true,

  initApi: (api) => {
    console.log('Ready 💪')
  },

  modules: [
    someRoutes,
    resBackendMethodModule,
    taskModule,
  ] as Module<RequestEvent>[], 
  // Maybe there is some better way to do this?
  // as we are in remultApi of sveltekit... We should know it already, no?!
})
