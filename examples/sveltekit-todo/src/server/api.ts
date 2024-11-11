import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'
import type { UserInfo } from 'remult'

export const api = remultSveltekit({
  admin: true,
  entities: [Task],
  controllers: [TasksController],
  getUser: async (event) => {
    const auth = await event?.locals?.auth()
    return auth?.user as UserInfo
  },
})
