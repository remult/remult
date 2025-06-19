import koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { createRemultServer } from '../../core/server/index.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'
import { someRoutes } from '../../test-servers/shared/modules/someRoutes/server.js'

describe.skipIf(process.env['SKIP_KOA'])('test koa server', async () => {
  let destroy: () => Promise<void>
  let port = 3002

  beforeAll(async () => {
    return new Promise<void>((res) => {
      const app = new koa()
      const api = createRemultServer({
        entities: [Task],
        admin: true,
        modules: [someRoutes],
      })
      app.use(bodyParser())
      app.use(async (ctx, next) => {
        const r = await api.handle(ctx.request)
        if (r) {
          ctx.response.body = r.data == null ? 'null' : r.data
          ctx.response.status = r.statusCode
        } else return await next()
      })
      app.use(async (ctx, next) => {
        if (ctx.path == '/api/test') {
          const remult = await api.getRemult(ctx.request)
          ctx.response.body = { result: await remult.repo(Task).count() }
        } else next()
      })
      let connection = app.listen(port, () => res())
      destroy = async () => {
        return new Promise<void>((res) => connection.close(() => res()))
      }
    })
  })

  allServerTests(port, { skipLiveQuery: true })
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
