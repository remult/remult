import express from 'express'
import {
  type RemultExpressServer,
  remultExpress,
} from '../../core/remult-express'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context'
import { allServerTests } from './all-server-tests'

describe('test express server', async () => {
  let remult = new Remult()
  let destroy: () => Promise<void>
  let port = 3004
  let api: RemultExpressServer
  beforeAll(async () => {
    return new Promise((res) => {
      const app = express()
      api = remultExpress({
        entities: [Task],
      })
      app.use(api)
      app.get('/api/test', api.withRemult, async (req, res) => {
        res.json({ result: await remult.repo(Task).count() })
      })
      let connection = app.listen(port, () => res())
      destroy = async () => {
        return new Promise((res) => connection.close(() => res()))
      }
    })
  })
  allServerTests(remult, port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
  it('test open api', async () => {
    expect(api.openApiDoc({ title: 'tasks' })).toMatchSnapshot()
  })
})
