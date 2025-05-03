import { remultFastify } from 'remult/remult-fastify'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'

export const api = remultFastify({
  entities: [Task],
  controllers: [TasksController],
})
