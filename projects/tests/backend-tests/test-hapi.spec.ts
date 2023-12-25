import { type Plugin, server } from '@hapi/hapi'
import { remultHapi } from '../../core/remult-hapi'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context'
import { allServerTests } from './all-server-tests'

describe('test hapi server', async () => {
  let remult = new Remult()
  let destroy: () => Promise<void>
  let port = 3010

  beforeAll(async () => {
    return new Promise(async (res) => {
      const app = server({ port })
      const api = remultHapi({
        entities: [Task],
      })
      await app.register(api)
      app.route({
        path: '/api/test',
        method: 'GET',
        handler: (request, h) => {
          return api.withRemult(request, async () => ({
            result: await remult.repo(Task).count(),
          }))
        },
      })
      app.start().then(() => res())
      destroy = async () => {
        return app.stop()
      }
    })
  })
  allServerTests(remult, port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
