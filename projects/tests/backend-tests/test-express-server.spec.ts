import express from 'express'
import {
  type RemultExpressServer,
  remultExpress,
} from '../../core/remult-express.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import { Remult, remult, withRemult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'

describe('test express server', async () => {
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
  allServerTests(port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
  it('test open api', async () => {
    expect(api.openApiDoc({ title: 'tasks' })).toMatchSnapshot()
  })
})
it('test with express remult async ', async () => {
  let initRequest: any[] = []
  const api = remultExpress({
    initRequest: async (r) => {
      initRequest.push(r)
    },
    getUser: async () => ({ id: '1', name: 'test' }),
  })
  expect(
    await api.withRemultAsync({ path: '123' } as any, async () => {
      return remult.user.id
    }),
  ).toBe('1')
  expect(initRequest).toEqual([{ path: '123' }])
  initRequest.splice(0)
  expect(
    await api.withRemultAsync(undefined, async () => {
      return remult.user?.id
    }),
  ).toBe(undefined)
  expect(initRequest).toEqual([])
})
it('test remult run', async () => {
  try {
    initAsyncHooks()
    expect(() => remult.user).toThrowErrorMatchingInlineSnapshot(
      '"remult object was requested outside of a valid context, try running it within initApi or a remult request cycle"',
    )
    let result = ''
    const test1 = await withRemult(async () => {
      remult.user = { id: '1', name: 'test' }
      result += remult.user.id
      withRemult(async () => {
        remult.user = { id: '2', name: 'test2' }
        result += remult.user.id
      })
      result += remult.user.id
    })
    expect(result).toMatchInlineSnapshot('"121"')
  } finally {
    RemultAsyncLocalStorage.disable()
  }
})
