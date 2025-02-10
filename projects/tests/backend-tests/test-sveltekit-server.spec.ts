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

      it(
        'test 404',
        withRemultForTest(async () => {
          try {
            await axios.get(remult.apiClient.url + '/nothing')
            expect('should never').toBe('be here')
          } catch (error) {
            expect(error).toMatchInlineSnapshot(
              `[AxiosError: Request failed with status code 404]`,
            )
          }
        }),
      )

      it(
        'should get html',
        withRemultForTest(async () => {
          const result = await axios.get(remult.apiClient.url + '/new-route')
          expect(result.data).toMatchInlineSnapshot(`
            {
              "Soooooo": "Cool! A new new-route!",
            }
          `)
        }),
      )

      it(
        'should setCookie',
        withRemultForTest(async () => {
          const result = await axios.get(remult.apiClient.url + '/setCookie')
          expect(result.headers['set-cookie']).toMatchInlineSnapshot(`
              [
                "res.setCookie=Plop; Path=/; HttpOnly; Secure; SameSite=Lax",
              ]
            `)
        }),
      )
    },
  )
})
