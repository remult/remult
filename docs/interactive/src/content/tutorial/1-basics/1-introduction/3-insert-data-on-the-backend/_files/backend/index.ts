import express from 'express'
import { remultApi } from 'remult/remult-express'
import { Task } from '../shared/Task.js'
import { repo } from 'remult'

export const app = express()
export const api = remultApi({
  entities: [Task],
})

app.use(api)
