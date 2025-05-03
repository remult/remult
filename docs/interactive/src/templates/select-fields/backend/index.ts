import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { TaskExtra } from '../shared/TaskExtra.js'
import { TaskLight } from '../shared/TaskLight.js'
import { repo } from 'remult'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'

export const app = express()
export const api = remultApi({
  entities: [Task, TaskExtra, TaskLight],
  admin: true,
  dataProvider: createSqlite3DataProvider(),
  initApi: async () => {
    try {
      const taskRepo = repo(TaskExtra)
      await taskRepo.deleteMany({ where: { title: { $not: '-1' } } })
      await taskRepo.insert([
        { title: 'Clean car', description: 'Turn off the engine first' },
        { title: 'Read a book', description: 'Get to a comfortable position' },
        {
          title: 'Buy groceries',
          completed: true,
          description: 'Make a list of items to buy',
        },
        {
          title: 'Do laundry',
          description: 'Wash clothes in the washing machine',
        },
        {
          title: 'Cook dinner',
          completed: true,
          description: 'Prepare the ingredients',
        },
        { title: 'Walk the dog', description: 'Take the dog for a walk' },
      ])
    } catch (error) {
      console.log(`error`, error)
    }
  },
})

app.use(api)
