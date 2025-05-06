import { remultApi } from 'remult/remult-nuxt'
import { Task } from '~/shared/task.js'
import { TasksController } from '~/shared/tasksController.js'
import { findUserById } from './auth/[...].js'
import { getToken } from '#auth'

export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) => findUserById((await getToken({ event }))?.sub),
})

export default defineEventHandler(api)
