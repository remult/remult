import { AsyncLocalStorage } from 'async_hooks'
import { expect, it, describe, beforeAll, beforeEach, afterEach } from 'vitest'
import { Remult, RemultAsyncLocalStorage } from '../core/src/context.js'

import { remult } from '../core/src/remult-proxy.js'
import { remultStatic } from '../core/src/remult-static.js'
import {
  AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore,
  SequentialRemultAsyncLocalStorageCore,
  StubRemultAsyncLocalStorageCore,
} from '../core/server/initAsyncHooks.js'
import { remultExpress } from '../core/remult-express'
import { entity } from './tests/dynamic-classes'
import { Fields, InMemoryDataProvider, repo, withRemult } from '../core'

it('test async hooks and static remult', async () => {
  let gotException = true
  try {
    remultStatic.asyncContext.getStore()
    gotException = false
  } catch {}
  expect(gotException).toBe(true)
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
  )
  try {
    expect(remultStatic.asyncContext.getStore()).toBe(undefined)
    RemultAsyncLocalStorage.enable()
    try {
      remult.isAllowed(false)
      gotException = false
    } catch {}
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
describe('test sequential async hooks', () => {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new SequentialRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
  it('test basic usage', async () => {
    let result: [string, string][] = []
    let p: Promise<any>[] = []
    for (let i = 0; i < 3; i++) {
      p.push(
        remultStatic.asyncContext.run(new Remult(), async () => {
          remult.user = { id: i.toString() }

          await new Promise((res) => setTimeout(res, 10))
          result.push([i.toString(), remult.user.id])
          if (i == 1) throw 'error'
        }),
      )
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
describe('test stub async hooks', () => {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new StubRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
  it('test nested local storage', async () => {
    let result = 0
    await remultStatic.asyncContext.run(new Remult(), async () => {
      await remultStatic.asyncContext.run(new Remult(), async () => {
        result = 1
      })
    })
    expect(result).toBe(1)
  })
})
describe('test with remult within get user & init request', () => {
  it('test with remult within get user & init request', async () => {
    const t = entity('t', { id: Fields.string() })
    var mem = new InMemoryDataProvider()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    const api = remultExpress({
      dataProvider: mem,
      initApi: async (req) => {
        await repo(t).insert({ id: '1' })
      },
      getUser: async (req) => {
        return api.withRemultAsync({} as any, () => repo(t).findFirst())
      },
    })
    const result = await api.withRemultAsync({} as any, () =>
      repo(t).findFirst(),
    )
    expect(result.id).toBe('1')
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
})

describe('test default data provider based in init api server', () => {
  it('test default data provider based in init api server', async () => {
    const t = entity('t', { id: Fields.string() })
    var mem = new InMemoryDataProvider()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    const api = remultExpress({
      dataProvider: mem,
      initApi: async (req) => {
        await repo(t).insert({ id: '1' })
      },
      getUser: async (req) => {
        return withRemult(() => repo(t).findFirst())
      },
    })
    const result = await withRemult(() => repo(t).findFirst())
    expect(result.id).toBe('1')
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
})
