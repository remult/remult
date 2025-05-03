import { remultApi } from 'remult/remult-solid-start'
import { Task } from './shared/Task.js'
import { TasksController } from './shared/TasksController.js'
import { getUser } from './auth.js'
import { createPostgresDataProvider } from 'remult/postgres'

const DATABASE_URL = process.env['DATABASE_URL']

export const api = remultApi({
  entities: [Task],
  admin: true,
  controllers: [TasksController],
  getUser,
  dataProvider: DATABASE_URL
    ? createPostgresDataProvider({ connectionString: DATABASE_URL })
    : undefined,
})
