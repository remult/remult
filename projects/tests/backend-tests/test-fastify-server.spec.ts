import fastify from 'fastify'
import { remultFastify } from '../../core/remult-fastify'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context'
import { allServerTests } from './all-server-tests'

describe('test fastify server', async () => {
  let remult = new Remult()
  let destroy: () => Promise<void>
  let port = 3003

  beforeAll(async () => {
    return new Promise(async (res) => {
      const app = fastify()
      const api = remultFastify({
        entities: [Task],
      })
      await app.register(api)
      app.get('/api/test', async (req, res) => {
        return {
          result: await api.withRemult(req, () => remult.repo(Task).count()),
        }
      })

      app.listen({ port }, () => res())
      destroy = async () => {
        return new Promise((res) => app.close(() => res()))
      }
    })
  })
  allServerTests(remult, port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
