import express from 'express'

import { createRemultServerCore } from '../../core/server/expressBridge'
import { Task } from '../shared/modules/task/Task'

const app = express()
app.use(express.json())

const api = createRemultServerCore<express.Request>(
  { entities: [Task], admin: true },
  {
    buildGenericRequestInfo: (req) => req,
    getRequestBody: (req) => req.body,
  },
)
app.use(async (req, res, next) => {
  ;(await api.handle(req, res)) || next()
})
app.get('/api/test', async (req, res) => {
  const remult = await api.getRemult(req)
  res.json({ result: await remult.repo(Task).count() })
})
const port = 3007
app.listen(port, () => console.log('mw ' + port))
