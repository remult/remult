import { describe } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
import { handler } from '../../test-servers/nuxt-server/.output/server/index.mjs'

describe('test nuxt server', async () => {
  testAsExpressMW(3013, handler)
})
