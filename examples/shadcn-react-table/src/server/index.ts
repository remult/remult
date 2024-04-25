import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../model/task.ts'
import { repo } from 'remult'
import { seed } from '../model/seed.ts'
export const app = express()

app.use(
  remultExpress({
    admin: true,
    entities: [Task],
    initApi: async () => {
      if ((await repo(Task).count()) == 0) await seed()
    },
  })
)
