import fastify from 'fastify'
import { remultApi } from '../../core/remult-fastify.js'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'

describe('test fastify server', async () => {
  let destroy: () => Promise<void>
  let port = 3003

  beforeAll(async () => {
    return new Promise<void>(async (res) => {
      const app = fastify()
      const api = remultApi({
        entities: [Task],
        admin: true,
      })
      await app.register(api)
      app.get('/api/test', async (req, res) => {
        return {
          result: await api.withRemult(req, () => remult.repo(Task).count()),
        }
      })

      app.listen({ port }, () => res())
      destroy = async () => {
        return new Promise<void>((res) => app.close(() => res()))
      }
    })
  })
  allServerTests(port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
