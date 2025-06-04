import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

export const app = express()
export const api = remultApi({
  entities: [Task],
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
