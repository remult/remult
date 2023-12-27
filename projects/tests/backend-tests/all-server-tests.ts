import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import EventSource from 'eventsource'
import { Task } from '../../test-servers/shared/Task.js'
import { Remult, remult, withRemult } from '../../core'
import axios from 'axios'

import { actionInfo } from '../../core/internals.js'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { SseSubscriptionClient } from '../../core/src/live-query/SseSubscriptionClient.js'
import express from 'express'

export function testAsExpressMW(
  port: number,
  handler: (req, res, next) => void,
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
  allServerTests(port)
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
) {
  initAsyncHooks()

  function withRemultForTest(what: () => Promise<void>): () => Promise<void> {
    return () => {
      return withRemult(async () => {
        remult.apiClient.httpClient = axios
        remult.apiClient.url = `http://127.0.0.1:${port}/api`
        SseSubscriptionClient.createEventSource = (url) => new EventSource(url)
        actionInfo.runningOnServer = false
        return await what()
      })
    }
  }

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
      const task = await (await repo).findFirst()
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
      let unsubscribe: VoidFunction
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
  async function create3Tasks() {
    const taskRepo = remult.repo(Task)
    for (const task of await taskRepo.find()) {
      await taskRepo.delete(task)
    }
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
