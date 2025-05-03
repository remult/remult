import { createPostgresDataProvider } from 'remult/postgres'

import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task'
import { TasksController } from '../shared/TasksController'

export const api = remultExpress({
  entities: [Task],
  controllers: [TasksController],
  getUser: (req) => req.session!['user'],
  dataProvider: createPostgresDataProvider({
    connectionString:
      process.env['DATABASE_URL'] ||
      'postgres://postgres:MASTERKEY@localhost/postgres',
  }),
})
