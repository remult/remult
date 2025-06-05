import { describe } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
import next from '../../test-servers/next-server/node_modules/next'
import express from 'express'

describe('test next server', async () => {
  const port = 3015
  const app = next({
    dir: './projects/test-servers/next-server',
  })
  const handle = app.getRequestHandler()
  await app.prepare()

  const mw = express.Router()
  mw.all('*', (req, res) => {
    return handle(req, res)
  })

  testAsExpressMW(port, mw, undefined, { skipExtraRoutes: true })
})
