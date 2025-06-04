import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from './shared/Task'
import { seedData } from './shared/SeedData'
import { createSqlite3DataProvider } from 'remult/remult-sqlite3'

export const app = express()
export const api = remultApi({
  entities: [Task],
  admin: true,
  dataProvider: createSqlite3DataProvider(),
  initApi: async () => {
    await seedData()
  },
})

app.use(api)
