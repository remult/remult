import { afterAll, beforeAll, describe } from 'vitest'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { allServerTests } from './all-server-tests.js'
import { handler } from '../../test-servers/sveltekit-server/build/handler.js'
import express from 'express'

describe('test sveltekit server', async () => {
  let destroy: () => Promise<void>
  let port = 3013

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
})
