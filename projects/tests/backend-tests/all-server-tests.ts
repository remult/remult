import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import EventSource from 'eventsource'
import { Task } from '../../test-servers/shared/Task'
import { type Remult, remult } from '../../core'
import axios from 'axios'

import { actionInfo } from '../../core/internals'
import { initAsyncHooks } from '../../core/server/initAsyncHooks'
import { RemultAsyncLocalStorage } from '../../core/src/context'
import { SseSubscriptionClient } from '../../core/src/live-query/SseSubscriptionClient'

export function allServerTests(
  remult: Remult,
  port: number,
  options?: {
    skipAsyncHooks?: boolean
    skipLiveQuery?: boolean
  },
) {
  initAsyncHooks()

  remult.apiClient.httpClient = axios
  remult.apiClient.url = `http://127.0.0.1:${port}/api`
  let path = remult.apiClient.url + '/tasks'
  function withRemult(what: () => Promise<void>): () => Promise<void> {
    return () =>
      new Promise((res, rej) => {
        SseSubscriptionClient.createEventSource = (url) => new EventSource(url)

        RemultAsyncLocalStorage.instance.run(remult, async () => {
          try {
            actionInfo.runningOnServer = false
            await what()
            res()
          } catch (error) {
            rej(error)
          }
        })
      })
  }

  it(
    'works',
    withRemult(async () => {
      const repo = await create3Tasks()
      const tasks = await repo.find({ where: { completed: true } })
      expect(tasks.length).toBe(1)
      await repo.save({ ...tasks[0], completed: false })
      expect(await repo.count({ completed: true })).toBe(0)
    }),
  )
  it(
    'test regular api call',
    withRemult(async () => {
      await create3Tasks()
      let result = await axios.get<{ result: number }>(
        remult.apiClient.url + '/test',
      )
      expect(result.data.result).toBe(3)
    }),
  )
  it(
    'test multiple items',
    withRemult(async () => {
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
    withRemult(async () => {
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
    withRemult(
      withRemult(async () => {
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
    withRemult(async () => {
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
        expect(progress.length > 2).toBe(true)
      } finally {
        actionInfo.startBusyWithProgress
      }
    }),
  )
  it.skipIf(options?.skipAsyncHooks)(
    'test static remult',
    withRemult(
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
    withRemult(async () => {
      const r = await create3Tasks()
      expect(await Task.testInjectedRemult()).toBe(3)
    }),
  )
  it(
    'test http 404',
    withRemult(async () => {
      const repo = create3Tasks()
      const task = await (await repo).findFirst()
      let result = await axios.get<{ id: string }>(path + '/' + task.id)
      expect(result.data.id).toBe(task.id)

      expect(result.status).toBe(200)
      let error = undefined
      try {
        result = await axios.get(path + '/123')
      } catch (err: any) {
        error = err
      }
      expect(error.response.status).toBe(404)
    }),
  )
  it(
    'test http 201',
    withRemult(async () => {
      let result = await axios.post<{ title: string; id: string }>(path, {
        title: 'z',
        id: '',
      })
      expect(result.data.title).toBe('z')
      expect(result.status).toBe(201)
      result = await axios.delete(path + '/' + result.data.id)
      expect(result.status).toBe(204)
    }),
  )

  it(
    'test regular api call',
    withRemult(async () => {
      await create3Tasks()
      let result = await axios.get<{ result: number }>(
        remult.apiClient.url + '/test',
      )
      expect(result.data.result).toBe(3)
    }),
  )
  it.skipIf(options?.skipLiveQuery)(
    'test live query',
    withRemult(async () => {
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
