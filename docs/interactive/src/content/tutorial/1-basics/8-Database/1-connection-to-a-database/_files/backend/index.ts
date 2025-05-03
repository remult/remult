import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { TasksController } from '../shared/TasksController.js'
import { repo, SqlDatabase } from 'remult'
import sqlite3 from 'sqlite3'
import { Sqlite3DataProvider } from 'remult/remult-sqlite3'

export const app = express()
export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],

  // Set the data provider here

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
