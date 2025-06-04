import koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { PassThrough } from 'stream'
import { createRemultServer } from '../../core/server/index'
import { Task } from '../shared/modules/task/Task'

const app = new koa()

const api = createRemultServer({ entities: [Task], admin: true })
app.use(bodyParser())
app.use(async (ctx, next) => {
  const r = await api.handle(ctx.request)
  if (r) {
    ctx.response.body = r.data
    ctx.response.status = r.statusCode
  } else return await next()
})
app.use(async (ctx, next) => {
  if (ctx.path == '/api/test') {
    const remult = await api.getRemult(ctx.request)
    ctx.response.body = { result: await remult.repo(Task).count() }
  } else next()
})
app.use(async (ctx, next) => {
  if (ctx.path == '/api/stream1') {
    ctx.request.socket.setTimeout(0)
    ctx.req.socket.setNoDelay(true)
    ctx.req.socket.setKeepAlive(true)
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    const stream = new PassThrough()
    ctx.status = 200
    ctx.body = stream
    const interval = setInterval(() => stream.write('noam\n\n'), 1000)
    stream.on('close', () => {
      console.log('Close connection')
      clearInterval(interval)
    })
  } else await next()
})

const port = 3002
app.listen(port, () => console.log('koa started on ' + port))
