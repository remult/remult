import { describe } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
import { handler } from '../../test-servers/sveltekit-server/build/handler.js'

describe('test sveltekit server', async () => {
  testAsExpressMW(3014, handler)
})
