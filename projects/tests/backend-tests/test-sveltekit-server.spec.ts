import { describe, expect, it } from 'vitest'
import { testAsExpressMW } from './all-server-tests.js'
//@ts-ignore
import { handler } from '../../test-servers/sveltekit-server/build/handler.js'
import axios from 'axios'
import { remult } from '../../core/index.js'

const REGEX_RESULT = /<pre id="result">([\s\S]*?)<\/pre>/
const REGEX_HTML_COMMENT = /<!--[\s\S]*?-->/g

describe('test sveltekit server', async () => {
  testAsExpressMW(
    3014,
    (req, res, next) => handler(req, res, next),
    (withRemultForTest) => {
      const withFetchPage = async (auth?: string) => {
        const html: string = (
          await axios.get('http://127.0.0.1:3014/with-fetch', {
            headers: auth ? { authorization: `Bearer ${auth}` } : {},
          })
        ).data
        const inner = html.match(REGEX_RESULT)![1]
        return JSON.parse(inner.replace(REGEX_HTML_COMMENT, ''))
      }
      it('withFetch in +page.server.ts and +page.ts goes through the api rules', async () => {
        expect(await withFetchPage()).toEqual({
          fromDb: ['1:s1', '2:s2'],
          fromApi: ['1:'],
          forbidden: 403,
          universal: ['1:'],
          ranOn: 'ssr',
        })
        expect(await withFetchPage('admin')).toEqual({
          fromDb: ['1:s1', '2:s2'],
          fromApi: ['1:s1', '2:s2'],
          forbidden: 403,
          universal: ['1:s1', '2:s2'],
          ranOn: 'ssr',
        })
      })
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
    // hooks.server.ts runs initRequest, so its crash surfaces as SvelteKit's 500
    { initRequestCrashStatus: 500 },
  )
})
