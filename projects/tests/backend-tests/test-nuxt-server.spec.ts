import { describe } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
//@ts-ignore
import { handler } from '../../test-servers/nuxt-server/.output/server/index.mjs'

describe('test nuxt server', async () => {
  testAsExpressMW(3013, (req, res, next) => handler(req, res, next))
})
