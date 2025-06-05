import { type Plugin, server } from '@hapi/hapi'
import { remultApi } from '../../core/remult-hapi.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import { Remult, remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'
import { someRoutes } from '../../test-servers/shared/modules/someRoutes/server.js'

describe('test hapi server', async () => {
  let destroy: () => Promise<void>
  let port = 3010

  beforeAll(async () => {
    return new Promise<void>(async (res) => {
      const app = server({ port })
      const api = remultApi({
        entities: [Task],
        admin: true,
        modules: [someRoutes],
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
  allServerTests(port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
