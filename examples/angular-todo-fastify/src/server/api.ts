import { remultApi } from 'remult/remult-fastify'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'

export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
})
