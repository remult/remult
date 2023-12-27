import { afterAll, beforeAll, describe } from 'vitest'
import { Task } from '../../test-servers/shared/Task.js'
import { remult } from '../../core'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'
import { createServer } from 'node:http'
import { handler } from '../../test-servers/nuxt-server/.output/server/index.mjs'

describe('test nuxt server', async () => {
  let destroy: () => Promise<void>
  let port = 3013

  beforeAll(async () => {
    return new Promise(async (res) => {
      const server = createServer((req, res) => {
        if (req.url.endsWith('/api/test')) {
          remult
            .repo(Task)
            .count()
            .then((c) => res.end(JSON.stringify({ result: c })))
        } else handler(req, res)
      })
      server.listen(port, () => res())
      destroy = async () => {
        return new Promise((res) => server.close(() => res()))
      }
    })
  })
  allServerTests(port)
  afterAll(async () => {
    RemultAsyncLocalStorage.disable()
    return destroy()
  })
})
