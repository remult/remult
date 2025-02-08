import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import EventSource from 'eventsource'
import { Task } from '../../test-servers/shared/Task.js'
import { Remult, RestDataProvider, remult, repo, withRemult } from '../../core'
import axios from 'axios'

import { actionInfo } from '../../core/internals.js'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { SseSubscriptionClient } from '../../core/src/live-query/SseSubscriptionClient.js'
import express from 'express'

export function testAsExpressMW(
  port: number,
  handler: (
    req: express.Request,
    res: express.Response,
    next: VoidFunction,
  ) => void,
  additionalTests?: (
    withRemultForTest: (what: () => Promise<void>) => () => Promise<void>,
  ) => void,
) {
  let destroy: () => Promise<void>

  beforeAll(async () => {
    return new Promise(async (res) => {
      const app = express()
      app.use(handler)
      let connection = app.listen(port, () => res())
      destroy = async () => {
        return new Promise((res) => connection.close(() => res()))
      }
    })
  })
  allServerTests(port, {}, additionalTests)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
}

export function allServerTests(
  port: number,
  options?: {
    skipAsyncHooks?: boolean
    skipLiveQuery?: boolean
  },
  additionalTests?: (
    withRemultForTest: (what: () => Promise<void>) => () => Promise<void>,
  ) => void,
) {
  initAsyncHooks()

  function withRemultForTest(what: () => Promise<void>): () => Promise<void> {
    return () => {
      return withRemult(async () => {
        remult.dataProvider = new RestDataProvider(() => remult.apiClient)
        remult.apiClient.httpClient = axios
        remult.apiClient.url = `http://127.0.0.1:${port}/api`
        SseSubscriptionClient.createEventSource = (url) =>
          new EventSource(url) as any
        actionInfo.runningOnServer = false
        return await what()
      })
    }
  }
  additionalTests?.(withRemultForTest)

  it(
    'works',
    withRemultForTest(async () => {
      const repo = await create3Tasks()
      const tasks = await repo.find({ where: { completed: true } })
      expect(tasks.length).toBe(1)
      await repo.save({ ...tasks[0], completed: false })
      expect(await repo.count({ completed: true })).toBe(0)
    }),
  )
  it(
    'test regular api call',
    withRemultForTest(async () => {
      await create3Tasks()
      let result = await axios.get<{ result: number }>(
        remult.apiClient.url + '/test',
      )
      expect(result.data.result).toBe(3)
    }),
  )
  it(
    'test me',
    withRemultForTest(async () => {
      let result = await axios.get<{ result: number }>(
        remult.apiClient.url + '/me',
      )
      expect(result.data).toBe(null)
    }),
  ),
    it(
      'test initUser',
      withRemultForTest(async () => {
        expect(await remult.initUser()).toBe(undefined)
      }),
    ),
    it(
      'delete many',
      withRemultForTest(async () => {
        await create3Tasks()
        expect(
          await repo(Task).deleteMany({ where: { title: ['a', 'c'] } }),
        ).toBe(2)
        expect(await repo(Task).count()).toBe(1)
      }),
    )
  it(
    'delete many 2',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).deleteMany({
          where: { $or: [{ title: 'a' }, { title: 'c' }] },
        }),
      ).toBe(2)
      expect(await repo(Task).count()).toBe(1)
    }),
  )
  it(
    'delete many 3',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).deleteMany({ where: { title: { $ne: 'b' } } }),
      ).toBe(2)
      expect(await repo(Task).count()).toBe(1)
    }),
  )
  it(
    'aggregate',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(await repo(Task).groupBy({ group: ['completed'] }))
        .toMatchInlineSnapshot(`
          [
            {
              "$count": 2,
              "completed": false,
            },
            {
              "$count": 1,
              "completed": true,
            },
          ]
        `)
    }),
  )
  it(
    'aggregate 3',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).groupBy({
          group: ['completed'],
          where: {
            $or: [{ completed: true }, { completed: false }],
          },
        }),
      ).toMatchInlineSnapshot(`
          [
            {
              "$count": 2,
              "completed": false,
            },
            {
              "$count": 1,
              "completed": true,
            },
          ]
        `)
    }),
  )
  it(
    'aggregate 2',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).groupBy({
          group: ['completed'],
          where: { completed: true },
        }),
      ).toMatchInlineSnapshot(`
          [
            {
              "$count": 1,
              "completed": true,
            },
          ]
        `)
    }),
  )
  it(
    'Test error in backend method',
    withRemultForTest(async () => {
      await expect(() => Task.testStringError()).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        {
          "httpStatusCode": 400,
          "message": "test error",
        }
      `)
    }),
  )
  it(
    'Test error in backend method 2',
    withRemultForTest(async () => {
      let ok = true
      try {
        await Task.testProperError()
        ok = false
      } catch (err: any) {
        expect(err.message).toBe('Test Error')
        expect(err.httpStatusCode).toBe(400)
        expect(err.stack.length > 10).toBe(true)
      }
    }),
  )
  it(
    'update many',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).updateMany({
          where: { title: ['a', 'c'] },
          set: { title: 'dd' },
        }),
      ).toBe(2)
      expect(await repo(Task).count({ title: 'dd' })).toBe(2)
      expect(await repo(Task).count({ title: { '!=': 'dd' } })).toBe(1)
    }),
  )
  it(
    'update many 3',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).updateMany({
          where: { title: { $ne: 'b' } },
          set: { title: 'dd' },
        }),
      ).toBe(2)
      expect(await repo(Task).count({ title: 'dd' })).toBe(2)
      expect(await repo(Task).count({ title: { '!=': 'dd' } })).toBe(1)
    }),
  )
  it(
    'update with url params',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        (
          await axios.put(remult.apiClient.url + '/tasks' + '?title.ne=b', {
            title: 'dd',
          })
        ).data,
      ).toMatchInlineSnapshot(`
        {
          "updated": 2,
        }
      `)
      expect(await repo(Task).count({ title: 'dd' })).toBe(2)
    }),
  )
  it(
    'admin',
    withRemultForTest(async () => {
      await create3Tasks()
      expect((await axios.get(remult.apiClient.url + '/admin')).status).toBe(
        200,
      )
    }),
  )
  it(
    'admin/',
    withRemultForTest(async () => {
      await create3Tasks()
      expect((await axios.get(remult.apiClient.url + '/admin/')).status).toBe(
        200,
      )
    }),
  )
  it(
    'admin/tasks',
    withRemultForTest(async () => {
      expect(
        (await axios.get(remult.apiClient.url + '/admin/tasks')).status,
      ).toBe(200)
    }),
  )
  it(
    'admin/__entities-metadata',
    withRemultForTest(async () => {
      expect(
        (await axios.get(remult.apiClient.url + '/admin/__entities-metadata'))
          .status,
      ).toBe(200)
    }),
  )
  it(
    'delete with url params',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        (await axios.delete(remult.apiClient.url + '/tasks' + '?title.ne=b'))
          .data,
      ).toMatchInlineSnapshot(`
        {
          "deleted": 2,
        }
      `)
      expect(await repo(Task).count()).toBe(1)
    }),
  )
  it(
    'update many 2',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(
        await repo(Task).updateMany({
          where: { $or: [{ title: 'a' }, { title: 'c' }] },
          set: { title: 'dd' },
        }),
      ).toBe(2)
      expect(await repo(Task).count({ title: 'dd' })).toBe(2)
      expect(await repo(Task).count({ title: { '!=': 'dd' } })).toBe(1)
    }),
  )
  it(
    'test task with empty Id',
    withRemultForTest(async () => {
      await create3Tasks()
      expect(await repo(Task).insert({ title: 'empty' }))
        .toMatchInlineSnapshot(`
        Task {
          "completed": false,
          "id": "",
          "title": "empty",
        }
      `)
      let item = (await remult.repo(Task).findId(''))!
      expect(item.title).toBe('empty')
      item.title += 1
      item = await remult.repo(Task).save(item)
      expect(item.title).toBe('empty1')
      await remult.repo(Task).delete(item)
      expect(await remult.repo(Task).count()).toBe(3)
    }),
  )
  it(
    'test multiple items',
    withRemultForTest(async () => {
      const repo = await create3Tasks()
      expect(
        await repo.count({
          title: { '!=': ['a', 'c'] },
        }),
      ).toBe(1)
    }),
  )
  it(
    'validation',
    withRemultForTest(async () => {
      const r = await create3Tasks()
      let err = undefined
      try {
        await r.insert({ title: '' })
      } catch (error: any) {
        err = error
      }
      expect(err).toEqual({
        message: 'Title: Should not be empty',
        httpStatusCode: 400,
        modelState: {
          title: 'Should not be empty',
        },
      })
    }),
  )
  it(
    'forbidden',
    withRemultForTest(
      withRemultForTest(async () => {
        let err = undefined
        try {
          await Task.testForbidden()
        } catch (error: any) {
          err = error
        }
        expect(err.httpStatusCode).toEqual(403)
      }),
    ),
  )
  it(
    'test queued job',
    withRemultForTest(async () => {
      let x = actionInfo.startBusyWithProgress
      let progress: number[] = []
      let close = false
      actionInfo.startBusyWithProgress = () => {
        return {
          progress: (p: number) => {
            progress.push(p)
          },
          close: () => (close = true),
        }
      }

      try {
        const promise = Task.testQueuedJob()
        expect(close).toBe(false)
        await promise
        expect(close).toBe(true)
        //expect(progress.length > 2).toBe(true)
      } finally {
        actionInfo.startBusyWithProgress
      }
    }),
  )
  it.skipIf(options?.skipAsyncHooks)(
    'test static remult',
    withRemultForTest(
      async () => {
        const r = await create3Tasks()
        expect(await Task.testStaticRemult()).toBe(3)
      },
      // servers.fresh,
      // servers.mwc,
    ),
  )
  it(
    'test injected remult',
    withRemultForTest(async () => {
      const r = await create3Tasks()
      expect(await Task.testInjectedRemult()).toBe(3)
    }),
  )
  it(
    'test http 404',
    withRemultForTest(async () => {
      const repo = create3Tasks()
      const task = (await (await repo).findFirst())!
      let result = await axios.get<{ id: string }>(
        remult.apiClient.url + '/tasks' + '/' + task.id,
      )
      expect(result.data.id).toBe(task.id)

      expect(result.status).toBe(200)
      let error = undefined
      try {
        result = await axios.get(remult.apiClient.url + '/tasks' + '/123')
      } catch (err: any) {
        error = err
      }
      expect(error.response.status).toBe(404)
    }),
  )
  it(
    'test http 201',
    withRemultForTest(async () => {
      let result = await axios.post<{ title: string; id: string }>(
        remult.apiClient.url + '/tasks',
        {
          title: 'z',
          id: '',
        },
      )
      expect(result.data.title).toBe('z')
      expect(result.status).toBe(201)
      result = await axios.delete(
        remult.apiClient.url + '/tasks' + '/' + result.data.id,
      )
      expect(result.status).toBe(204)
    }),
  )
  it.skipIf(options?.skipLiveQuery)(
    'test live query',
    withRemultForTest(async () => {
      const repo = await create3Tasks()
      let tasks: Task[] = []
      let unsubscribe: VoidFunction = () => {}
      try {
        await new Promise((res, reject) => {
          unsubscribe = repo.liveQuery({}).subscribe({
            next: ({ applyChanges }) => {
              tasks = applyChanges(tasks)
              res({})
            },
            error: (err) => reject(err),
          })
        })
        expect(tasks.length).toBe(3)
        await repo.insert({ title: 'd' })
        await new Promise((res) => setTimeout(() => res({}), 100))
        expect(tasks.length).toBe(4)
      } finally {
        await unsubscribe()
        await new Promise((res) => setTimeout(() => res({}), 100))
      }
    }),
  )
  it.skipIf(options?.skipLiveQuery)(
    'test live query with in statement',
    withRemultForTest(async () => {
      const repo = await create3Tasks()
      let tasks: Task[] = []
      let unsubscribe: VoidFunction = () => {}
      try {
        await new Promise((res, reject) => {
          unsubscribe = repo
            .liveQuery({
              where: {
                title: ['b', 'c', 'd'],
              },
            })
            .subscribe({
              next: ({ applyChanges }) => {
                tasks = applyChanges(tasks)
                res({})
              },
              error: (err) => reject(err),
            })
        })
        expect(tasks.length).toBe(2)
        await repo.insert({ title: 'd' })
        await new Promise((res) => setTimeout(() => res({}), 100))
        expect(tasks.length).toBe(3)
      } finally {
        await unsubscribe()
        await new Promise((res) => setTimeout(() => res({}), 100))
      }
    }),
  )
  it.skipIf(options?.skipLiveQuery)(
    'test live query with in statement',
    withRemultForTest(async () => {
      const repo = await create3Tasks()
      let tasks: Task[] = []
      let unsubscribe: VoidFunction = () => {}
      try {
        await new Promise((res, reject) => {
          unsubscribe = repo
            .liveQuery({
              where: {
                title: [
                  'b',
                  'c',
                  'd',
                  ...Array.from({ length: 10000 }, (_, i) => i.toString()),
                ],
              },
            })
            .subscribe({
              next: ({ applyChanges }) => {
                tasks = applyChanges(tasks)
                res({})
              },
              error: (err) => reject(err),
            })
        })
        expect(tasks.length).toBe(2)
        await repo.insert({ title: 'd' })
        await new Promise((res) => setTimeout(() => res({}), 100))
        expect(tasks.length).toBe(3)
      } finally {
        await unsubscribe()
        await new Promise((res) => setTimeout(() => res({}), 100))
      }
    }),
  )
  async function create3Tasks() {
    const taskRepo = remult.repo(Task)

    await taskRepo.deleteMany({ where: { id: { '!=': null! } } })

    expect(await taskRepo.count()).toBe(0)
    await taskRepo.insert([
      { title: 'a' },
      { title: 'b', completed: true },
      { title: 'c' },
    ])
    expect(await taskRepo.count()).toBe(3)
    return taskRepo
  }
}
