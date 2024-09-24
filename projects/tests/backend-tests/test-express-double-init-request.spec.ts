import express from 'express'
import { remultExpress } from '../../core/remult-express.js'
import { describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import {
  BackendMethod,
  InMemoryDataProvider,
  remult,
  RestDataProvider,
  withRemult,
} from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import axios from 'axios'
import { SseSubscriptionClient } from '../../core/src/live-query/SseSubscriptionClient.js'
import { actionInfo } from '../../core/internals.js'

describe.skip('test express server', async () => {
  it('Test double init request', async () => {
    let destroy: () => Promise<void> = async () => {}
    try {
      const port = 3006
      let initRequestCount = 0
      let api = remultExpress({
        entities: [Task],
        dataProvider: new InMemoryDataProvider(),
        initRequest: async () => {
          initRequestCount++
        },
      })

      const app = express()
      app.use(api.withRemult)
      app.use(api)
      await new Promise<void>((res) => {
        let connection = app.listen(port, () => res())
        destroy = async () => {
          return new Promise((res) => connection.close(() => res()))
        }
      })

      await withRemult(async () => {
        remult.dataProvider = new RestDataProvider(() => remult.apiClient)
        remult.apiClient.httpClient = axios
        remult.apiClient.url = `http://127.0.0.1:${port}/api`
        SseSubscriptionClient.createEventSource = (url) =>
          new EventSource(url) as any
        actionInfo.runningOnServer = false
        // the test

        const res = await remult.repo(Task).count()
        expect(initRequestCount).toBe(1)

        // end the test
      })
    } finally {
      RemultAsyncLocalStorage.disable()
      await destroy()
    }
  })
  it.only('Test double init request 2', async () => {
    let destroy: () => Promise<void> = async () => {}
    try {
      const port = 3005
      let initRequestCount = 0
      let api = remultExpress({
        entities: [Task],
        controllers: [MyController],
        dataProvider: new InMemoryDataProvider(),
        initRequest: async () => {
          initRequestCount++
        },
      })

      const app = express()
      app.use(api.withRemult)
      app.use(api)
      await new Promise<void>((res) => {
        let connection = app.listen(port, () => res())
        destroy = async () => {
          return new Promise((res) => connection.close(() => res()))
        }
      })

      await withRemult(async () => {
        remult.dataProvider = new RestDataProvider(() => remult.apiClient)
        remult.apiClient.httpClient = axios
        remult.apiClient.url = `http://127.0.0.1:${port}/api`
        SseSubscriptionClient.createEventSource = (url) =>
          new EventSource(url) as any
        actionInfo.runningOnServer = false
        // the test

        const res = await MyController.test()
        expect(initRequestCount).toBe(1)

        // end the test
      })
    } finally {
      RemultAsyncLocalStorage.disable()
      await destroy()
    }
  })
})
class MyController {
  @BackendMethod({ allowed: true })
  static async test() {
    await new Promise((res) =>
      setTimeout(() => {
        res({})
      }, 10),
    )
    return 'test'
  }
}
