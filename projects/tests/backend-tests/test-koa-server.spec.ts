import koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { createRemultServer } from '../../core/server/index'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context'
import { allServerTests } from './all-server-tests'

describe('test koa server', async () => {
  let remult = new Remult()
  let destroy: () => Promise<void>
  let port = 3002

  beforeAll(async () => {
    return new Promise((res) => {
      const app = new koa()
      const api = createRemultServer({
        entities: [Task],
      })
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
      let connection = app.listen(port, () => res())
      destroy = async () => {
        return new Promise((res) => connection.close(() => res()))
      }
    })
  })
  allServerTests(remult, port, { skipLiveQuery: true })
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
