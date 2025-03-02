import express from 'express'
import {
  type RemultExpressServer,
  remultExpress,
} from '../../core/remult-express.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { Task, test_compound_id } from '../../test-servers/shared/Task.js'
import {
  InMemoryDataProvider,
  Remult,
  remult,
  repo,
  withRemult,
  type ErrorInfo,
} from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests, testAsExpressMW } from './all-server-tests.js'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'
import type { RemultServerOptions } from '../../core/server/index.js'

describe('test express server', async () => {
  let throwExceptionOnGetUser = false
  let errorHandler: RemultServerOptions<unknown>['error']
  beforeEach(() => {
    throwExceptionOnGetUser = false
    errorHandler = undefined
  })
  let api = remultExpress({
    entities: [Task, test_compound_id],
    dataProvider: new InMemoryDataProvider(),
    admin: {
      allow: true,
      customHtmlHead: (r) =>
        `<title>Test Admin (${r.user?.name ?? 'Anonymous'})</title>`,
    },
    error: (e) => errorHandler?.(e),
    getUser: async () => {
      if (throwExceptionOnGetUser)
        throw {
          httpStatusCode: 403,
          message: 'not allowed',
        } satisfies ErrorInfo
      return undefined
    },
  })
  const app = express.Router()
  app.use(api)
  app.get('/api/test', api.withRemult, async (req, res) => {
    res.json({ result: await remult.repo(Task).count() })
  })
  testAsExpressMW(3009, app, (withRemult) => {
    it(
      'test error handler',
      withRemult(async () => {
        const r = repo(test_compound_id)
        errorHandler = async ({ req, ...e }) => {
          expect({ ...e, req: Boolean(req) }).toMatchInlineSnapshot(`
            {
              "entity": undefined,
              "exception": {
                "message": "NotFound",
              },
              "httpStatusCode": 404,
              "req": true,
              "responseBody": {
                "message": "NotFound",
              },
              "sendError": [Function],
            }
          `)
          e.sendError(432, e.responseBody)
        }
        await expect(() => r.delete(1232131)).rejects
          .toThrowErrorMatchingInlineSnapshot(`
          {
            "httpStatusCode": 432,
            "message": "NotFound",
          }
        `)
      }),
    )
    it(
      'test one more thing',
      withRemult(async () => {
        const r = repo(test_compound_id)
        await r.insert({ a: 'a', b: '', c: 'c', d: 'd' })
        await r.update({ a: 'a', b: '', c: 'c' }, { d: 'd1' })
        expect(await r.find()).toMatchInlineSnapshot(`
          [
            test_compound_id {
              "a": "a",
              "b": "",
              "c": "c",
              "d": "d1",
            },
          ]
        `)
      }),
    )
    it(
      'test exception on get user',
      withRemult(async () => {
        const r = repo(test_compound_id)
        throwExceptionOnGetUser = true

        await expect(() => r.find()).rejects
          .toThrowErrorMatchingInlineSnapshot(`
          {
            "httpStatusCode": 403,
            "message": "not allowed",
          }
        `)
      }),
    )
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
      return remult.user!.id
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
      `[Error: remult object was requested outside of a valid request cycle.valid context, try running \`withRemult\` or run  within initApi or a remult request cycle]`,
    )
    let result = ''
    const test1 = await withRemult(async () => {
      remult.user = { id: '1', name: 'test' }
      result += remult.user.id
      await withRemult(async () => {
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
