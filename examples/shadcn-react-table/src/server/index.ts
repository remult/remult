import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../model/task.ts'
import { InMemoryDataProvider, SqlDatabase, remult, repo } from 'remult'
import { seed } from '../model/seed.ts'
import { createPostgresDataProvider } from 'remult/postgres'
import fs from 'fs'

export const app = express()
const DATABASE_URL = process.env['DATABASE_URL']
app.use(
  remultApi({
    dataProvider: DATABASE_URL
      ? createPostgresDataProvider({ connectionString: DATABASE_URL })
      : // Use JsonDataProvider if DATABASE_URL is not set
        undefined,
    admin: true,
    entities: [Task],
    initApi: async () => {
      const taskRepo = repo(Task)
      if ((await taskRepo.count()) == 0) {
        if (remult.dataProvider instanceof SqlDatabase) await seed()
        else {
          // If using JsonDataProvider, first insert the rows in memory and then save them to a file
          const mem = new InMemoryDataProvider()
          await seed(mem)
          if (!fs.existsSync('./db')) {
            fs.mkdirSync('./db')
          }
          fs.writeFileSync(
            `./db/${taskRepo.metadata.dbName}.json`,
            JSON.stringify(mem.rows[taskRepo.metadata.dbName]),
          )
        }
      }
    },
  }),
)
