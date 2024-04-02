import { AsyncLocalStorage } from 'async_hooks'
import { expect, it, describe, beforeAll, beforeEach, afterEach } from 'vitest'
import { Remult, RemultAsyncLocalStorage } from '../core/src/context.js'

import { remult } from '../core/src/remult-proxy.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore, SequentialRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'

it('test async hooks and static remult', async () => {
  let gotException = true
  try {
    remultStatic.asyncContext.getRemult()
    gotException = false
  } catch { }
  expect(gotException).toBe(true)
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
  )
  try {
    expect(remultStatic.asyncContext.getRemult()).toBe(undefined)
    RemultAsyncLocalStorage.enable()
    try {
      remult.isAllowed(false)
      gotException = false
    } catch { }
    expect(gotException).toBe(true)
    const promises = []
    remultStatic.asyncContext.run(new Remult(), async () => {
      remult.user = { id: 'noam' }
      promises.push(
        new Promise((res) => {
          setTimeout(() => {
            expect(remult.user.id).toBe('noam')
            res({})
          }, 10)
        }),
      )
      remultStatic.asyncContext.run(new Remult(), async () => {
        remult.user = { id: 'yoni' }
        promises.push(
          new Promise((res) => {
            setTimeout(() => {
              expect(remult.user.id).toBe('yoni')
              res({})
            }, 10)
          }),
        )
      })
      promises.push(
        new Promise((res) => {
          setTimeout(() => {
            expect(remult.user.id).toBe('noam')
            res({})
          }, 10)
        }),
      )
    })
    await Promise.all(promises)
  } finally {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  }
})
describe("test sequential async hooks", () => {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new SequentialRemultAsyncLocalStorageCore()
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
  it("test basic usage", async () => {
    let result: [string, string][] = []
    let p: Promise<any>[] = []
    for (let i = 0; i < 3; i++) {
      p.push(remultStatic.asyncContext.run(new Remult(), async () => {
        remult.user = { id: i.toString() }

        await new Promise((res) => setTimeout(res, 10))
        result.push([i.toString(), remult.user.id])
        if (i == 1)
          throw "error"
      }))
    }
    for (const pr of p) {
      try {
        await pr
      } catch (err) {
        expect(err).toMatchInlineSnapshot('"error"')
      }

    }
    expect(result).toMatchInlineSnapshot(`
      [
        [
          "0",
          "0",
        ],
        [
          "1",
          "1",
        ],
        [
          "2",
          "2",
        ],
      ]
    `)
  })
})