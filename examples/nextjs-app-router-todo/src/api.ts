import { remultNextApp } from 'remult/remult-next'
import { Task } from './shared/task'
import { TasksController } from './shared/tasksController'
import { getUserOnServer } from './auth'

export const api = remultNextApp({
  entities: [Task],
  controllers: [TasksController],
  getUser: getUserOnServer,
})
