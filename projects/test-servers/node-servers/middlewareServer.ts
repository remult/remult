import express from 'express'
import { remult } from '../../core'
import { createRemultServer } from '../../core/server/index'
import { Task } from '../shared/modules/task/Task'

const app = express()
app.use(express.json())

const api = createRemultServer({ entities: [Task], admin: true })
app.use(async (req, res, next) => {
  ;(await api.handle(req, res)) || next()
})
app.get('/api/test', api.withRemult, async (req, res) => {
  res.json({ result: await remult.repo(Task).count() })
})
const port = 3005
app.listen(port, () => console.log('mw ' + port))
