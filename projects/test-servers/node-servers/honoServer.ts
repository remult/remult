import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { Task } from '../shared/Task.js'
import { remultApi } from '../../core/remult-hono.js'
import { repo } from 'remult'

const app = new Hono()

const api = remultApi({
  entities: [Task],
  admin: true,
})

app.get('/test', (c) =>
  api.withRemult(c, async () => c.text('hello ' + (await repo(Task).count()))),
)
app.get('/test1', api.withRemult, async (c) =>
  c.text('hello ' + (await repo(Task).count())),
)
app.get('/test2', (c) => {
  return new Promise((res, rej) => rej('error'))
})
app.route('', api)

serve(app)
