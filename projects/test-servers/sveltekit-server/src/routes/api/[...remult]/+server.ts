import { remultApi } from 'remult/remult-sveltekit'
import { someRoutes } from '../../../../../shared/modules/someRoutes/server.js'
import { Task } from '../../../shared/Task'
import { TasksController } from '../../../shared/TasksController'

export const _api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  admin: true,
  modules: [someRoutes as any],
})

export const { PUT, POST, DELETE, GET } = _api
