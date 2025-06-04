import { remultApi } from 'remult/remult-sveltekit'
import { someRoutes } from '../../../shared/modules/someRoutes/server.js'
import { resBackendMethodModule } from '../../../shared/modules/resBackendMethod/server.js'
import { taskModule } from '../../../shared/modules/task/server.js'

export const api = remultApi({
  admin: true,

  initApi: (api) => {
    console.log('Ready 💪')
  },

  modules: [
    // JYC TODO: type!
    someRoutes,
    resBackendMethodModule,
    taskModule,
  ],
})
