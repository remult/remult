import { describe, expect, it } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
//@ts-ignore
import { handler } from '../../test-servers/sveltekit-server/build/handler.js'
import axios from 'axios'
import { remult } from '../../core/index.js'

describe('test sveltekit server', async () => {
  testAsExpressMW(
    3014,
    (req, res, next) => handler(req, res, next),
    (withRemultForTest) => {
      it(
        'test headers in response',
        withRemultForTest(async () => {
          let result = await axios.post(remult.apiClient.url + '/addHeader', {
            args: ['test'],
          })
          expect(result.headers['set-cookie']).toMatchInlineSnapshot(`
          [
            "KIT_REMULT_COOKIE=test; Path=/api/; HttpOnly; Secure; SameSite=Lax",
          ]
        `)
          expect(
            result.headers['header-from-remult-controller'],
          ).toMatchInlineSnapshot('"test"')
        }),
      )
    },
  )
})
