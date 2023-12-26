import { AsyncLocalStorage } from 'async_hooks'
import { expect, it } from 'vitest'
import { Remult, RemultAsyncLocalStorage } from '../core/src/context.js'

import { remult } from '../core/src/remult-proxy.js'

it('test async hooks and static remult', async () => {
  let gotException = true
  try {
    RemultAsyncLocalStorage.instance.getRemult()
    gotException = false
  } catch {}
  expect(gotException).toBe(true)
  RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(
    new AsyncLocalStorage(),
  )
  try {
    expect(RemultAsyncLocalStorage.instance.getRemult()).toBe(undefined)
    RemultAsyncLocalStorage.enable()
    try {
      remult.isAllowed(false)
      gotException = false
    } catch {}
    expect(gotException).toBe(true)
    const promises = []
    RemultAsyncLocalStorage.instance.run(new Remult(), () => {
      remult.user = { id: 'noam' }
      promises.push(
        new Promise((res) => {
          setTimeout(() => {
            expect(remult.user.id).toBe('noam')
            res({})
          }, 10)
        }),
      )
      RemultAsyncLocalStorage.instance.run(new Remult(), () => {
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
    RemultAsyncLocalStorage.instance = new RemultAsyncLocalStorage(undefined)
  }
})
