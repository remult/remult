import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../model/task.ts'
import { InMemoryDataProvider, repo } from 'remult'
import { seed } from '../model/seed.ts'
import fs from 'fs'

export const app = express()

app.use(
  remultExpress({
    admin: true,
    entities: [Task],
    initApi: async () => {
      if ((await repo(Task).count()) == 0) {
        const mem = new InMemoryDataProvider()
        await seed(mem)
        fs.writeFileSync('./db/tasks.json', JSON.stringify(mem.rows['tasks']))
      }
    },
  }),
)
