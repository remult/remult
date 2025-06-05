import { remultNext } from 'remult/remult-next'
import { Task } from '../../shared/Task'
import { someRoutes } from '../../../../shared/modules/someRoutes/server.js'

export default remultNext({
  entities: [Task],
  admin: true,
  modules: [someRoutes as any],
})
