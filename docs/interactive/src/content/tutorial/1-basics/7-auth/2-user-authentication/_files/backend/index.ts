import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { TasksController } from '../shared/TasksController.js'
import { remult, repo } from 'remult'
import session from 'cookie-session'
import { AuthController } from '../shared/AuthController'

export const app = express()

// <-- add cookie-session code here

export const api = remultApi({
  entities: [Task],
  controllers: [TasksController], // <-- add UserController here
  // <-- Add `getUser` here
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
