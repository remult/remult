import express from 'express'
import { remultApi } from '../../core/remult-express.js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import {
  InMemoryDataProvider,
  remult,
  RestDataProvider,
  withRemult,
} from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import axios from 'axios'
import EventSource from 'eventsource'
import { SseSubscriptionClient } from '../../core/src/live-query/SseSubscriptionClient.js'
import { actionInfo } from '../../core/internals.js'

const port = 3022

describe.sequential('sse live query http', () => {
  let destroy: () => Promise<void> = async () => {}

  beforeAll(async () => {
    const api = remultApi({
      entities: [Task],
      dataProvider: new InMemoryDataProvider(),
    })
    const app = express()
    app.use(api)
    await new Promise<void>((res) => {
      const connection = app.listen(port, () => res())
      destroy = () =>
        new Promise((r) => connection.close(() => r()))
    })
  })

  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    await destroy()
  })

  it('keep-alive accepts array and object body', async () => {
    const old = await axios.post(
      `http://127.0.0.1:${port}/api/_liveQueryKeepAlive`,
      ['missing-id'],
    )
    expect(old.data).toEqual(['missing-id'])
    const neu = await axios.post(
      `http://127.0.0.1:${port}/api/_liveQueryKeepAlive`,
      { queryIds: ['missing-id'] },
    )
    expect(neu.data).toEqual({
      unknownQueryIds: ['missing-id'],
      versions: {},
    })
  })

  it(
    'EventSource live query, ping, drop does not 1s-poll keep-alive',
    async () => {
      await withRemult(async () => {
        remult.dataProvider = new RestDataProvider(() => remult.apiClient)
        remult.apiClient.httpClient = axios
        remult.apiClient.url = `http://127.0.0.1:${port}/api`
        actionInfo.runningOnServer = false
        const origEs = SseSubscriptionClient.createEventSource
        const sources: EventSource[] = []
        let pings = 0
        SseSubscriptionClient.createEventSource = (url) => {
          const es = new EventSource(url) as any
          es.addEventListener('keep-alive', () => {
            pings++
          })
          sources.push(es)
          return es
        }

        let keepAlivePosts = 0
        const origPost = axios.post.bind(axios)
        axios.post = ((url: string, data?: any, config?: any) => {
          if (String(url).includes('_liveQueryKeepAlive')) keepAlivePosts++
          return origPost(url, data, config)
        }) as typeof axios.post

        let tasks: Task[] = []
        let unsub: () => void = () => {}
        try {
          await remult.repo(Task).insert({ title: 'a' })
          await new Promise<void>((res, rej) => {
            unsub = remult.repo(Task).liveQuery().subscribe({
              next: ({ applyChanges }) => {
                tasks = applyChanges(tasks)
                if (tasks.length >= 1) res()
              },
              error: rej,
            })
          })
          expect(tasks.length).toBe(1)

          await vi.waitFor(() => expect(sources.length).toBeGreaterThan(0))
          await vi.waitFor(() => expect(pings).toBeGreaterThan(0))

          await remult.repo(Task).insert({ title: 'b' })
          await vi.waitFor(() => expect(tasks.length).toBe(2))

          keepAlivePosts = 0
          sources[0].close()
          await new Promise((r) => setTimeout(r, 2500))
          expect(keepAlivePosts).toBeLessThan(2)
        } finally {
          unsub()
          for (const s of sources) {
            try {
              s.close()
            } catch {}
          }
          axios.post = origPost
          SseSubscriptionClient.createEventSource = origEs
          await new Promise((r) => setTimeout(r, 100))
        }
      })
    },
    15_000,
  )
})
