import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { TasksController } from '../shared/TasksController.js'
import { remult, repo } from 'remult'
import session from 'cookie-session'
import { AuthController } from '../shared/AuthController.js'

export const app = express()

app.enable('trust proxy') // required for stackblitz and other reverse proxy scenarios
app.use(
  session({
    signed: false, // only for dev on stackblitz, use secret in production
    // secret: process.env['SESSION_SECRET'] || 'my secret',
  }),
)

export const api = remultApi({
  entities: [Task],
  controllers: [TasksController, AuthController],
  getUser: (request) => request.session?.['user'],
  initApi: async () => {
    const taskRepo = repo(Task)
    if ((await taskRepo.count()) == 0) {
      await taskRepo.insert([
        { title: 'Clean car' },
        { title: 'Read a book' },
        { title: 'Buy groceries', completed: true },
        { title: 'Do laundry' },
        { title: 'Cook dinner', completed: true },
        { title: 'Walk the dog' },
      ])
    }
  },
})

app.use(api)
