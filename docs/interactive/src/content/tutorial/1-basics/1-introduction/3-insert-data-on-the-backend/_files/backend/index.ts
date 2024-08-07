import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

export const app = express()
export const api = remultExpress({
  entities: [Task],
})

app.use(api)
