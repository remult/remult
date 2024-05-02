import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from '../../../shared/task'
import { TasksController } from '../../../shared/tasksController'
import type { UserInfo } from 'remult'

export const _api = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) => {
    const auth = await event?.locals?.auth()
    return auth?.user as UserInfo
  },
})

export const { GET, POST, PUT, DELETE } = _api
