import { AsyncLocalStorage } from 'async_hooks'
import { expect, it, describe, beforeAll, beforeEach, afterEach } from 'vitest'
import { Remult, RemultAsyncLocalStorage } from '../core/src/context.js'

import { remult } from '../core/src/remult-proxy.js'
import { remultStatic } from '../core/src/remult-static.js'
import {
  AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore,
  StubRemultAsyncLocalStorageCore,
} from '../core/server/initAsyncHooks.js'
import { remultApi } from '../core/remult-express'
import { entity } from './tests/dynamic-classes'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  repo,
  withRemult,
  type DataProvider,
  type UserInfo,
} from '../core'
import { withRemultDataProvider } from '../core/src/context.js'
describe('test with remult and withDataProvider', () => {
  beforeEach(() => {
    var before = remultStatic.asyncContext
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
    return () => {
      remultStatic.asyncContext = before
      RemultAsyncLocalStorage.disable()
    }
  })

  it('another test', async () => {
    expect(
      await withRemult(async () => {
        remult.user = { id: 'noam' }
        return remult.user.id
      }),
    ).toBe('noam')
  })
  it('test with remult', async () => {
    @Entity('test')
    class testEntity {
      @Fields.id()
      id = ''
    }

    const result = withRemult(async () => {
      remult.dataProvider = new InMemoryDataProvider()
      await repo(testEntity).insert({ id: '1' })

      let resolve: () => void = () => {}
      var wait = new Promise<void>((res) => (resolve = res))

      const result = Promise.all([
        withRemultDataProvider(
          { dataProvider: new InMemoryDataProvider() },
          async () => {
            await repo(testEntity).insert({ id: '2' })
            remult.user = { id: 'noam' }
            await wait
            return [
              remult.user.id,
              ...(await repo(testEntity)
                .find()
                .then((x) => x.map((y) => y.id))),
            ]
          },
        ),
        (async () => {
          remult.user = { id: 'yoni' }
          await wait
          return [
            remult.user.id,
            ...(await repo(testEntity)
              .find()
              .then((x) => x.map((y) => y.id))),
          ]
        })(),
      ])
      resolve()
      expect(
        await repo(testEntity)
          .find()
          .then((x) => x.map((x) => x.id)),
      ).toEqual(['1'])
      return result
    })
    expect(await result).toEqual([
      ['noam', '2'],
      ['yoni', '1'],
    ])
  })
})
describe('test with data provider fall back', async () => {
  it('test with data provider fall back', async () => {
    expect(
      await withRemultDataProvider(
        { dataProvider: new InMemoryDataProvider() },
        async () => {
          return 'noam'
        },
      ),
    ).toBe('noam')
  })
})

describe('test async hooks and static remult', () => {
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
      const promises: Promise<any>[] = []
      remultStatic.asyncContext.run(new Remult(), async () => {
        remult.user = { id: 'noam' }
        promises.push(
          new Promise((res) => {
            setTimeout(() => {
              expect(remult.user?.id).toBe('noam')
              res({})
            }, 10)
          }),
        )
        remultStatic.asyncContext.run(new Remult(), async () => {
          remult.user = { id: 'yoni' }
          promises.push(
            new Promise((res) => {
              setTimeout(() => {
                expect(remult.user?.id).toBe('yoni')
                res({})
              }, 10)
            }),
          )
        })
        promises.push(
          new Promise((res) => {
            setTimeout(() => {
              expect(remult.user?.id).toBe('noam')
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
})

describe('test stub async hooks', () => {
  beforeEach(() => {
    RemultAsyncLocalStorage.enable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new StubRemultAsyncLocalStorageCore(),
    )
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
  it('test two with remult runs init request twice', async () => {
    var x = remultStatic.asyncContext
    const t = entity('t', { id: Fields.string() })
    var mem = new InMemoryDataProvider()
    let count = 0
    const api = remultApi({
      dataProvider: mem,
      entities: [],
      initApi: async (req) => {
        await repo(t).insert({ id: '1' })
      },
      getUser: async (req) => {
        count++
        return undefined
      },
    })
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new StubRemultAsyncLocalStorageCore(),
    )
    const result = await api.withRemultAsync({} as any, () =>
      repo(t).findFirst(),
    )
    expect(result?.id).toBe('1')
    await api.withRemultAsync({} as any, () => repo(t).findFirst())
    expect(count).toBe(2)
  })
})
describe('test with remult within get user & init request', () => {
  it.skip('test with remult within get user & init request', async () => {
    const t = entity('t', { id: Fields.string() })
    var mem = new InMemoryDataProvider()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    const api = remultApi({
      dataProvider: mem,
      entities: [],
      initApi: async (req) => {
        await repo(t).insert({ id: '1' })
      },
      getUser: async (req) => {
        return (await api.withRemultAsync({} as any, () =>
          repo(t).findFirst(),
        )) as UserInfo
      },
    })
    const result = await api.withRemultAsync({} as any, () =>
      repo(t).findFirst(),
    )
    expect(result?.id).toBe('1')
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
    const api = remultApi({
      dataProvider: mem,
      entities: [],
      initApi: async (req) => {
        await repo(t).insert({ id: '1' })
      },
      getUser: async (req) => {
        return (await withRemult(() => repo(t).findFirst())) as UserInfo
      },
    })
    const result = await withRemult(() => repo(t).findFirst())
    expect(result?.id).toBe('1')
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })
})
describe('errors with withRemult', () => {
  it('api with remult provides sensible error', async () => {
    const api = remultApi({
      initApi: async (req) => {},
      entities: [],
    })
    let error = false
    try {
      await api.withRemultAsync(undefined, async () => {
        throw Error('the error')
      })
    } catch (err) {
      error = true
      expect(err).toMatchInlineSnapshot(`[Error: the error]`)
    }
    expect(error).toBe(true)
  })
  it('api with remult provides sensible error', async () => {
    const api = remultApi({
      initApi: async (req) => {},
      entities: [],
    })
    let error = false
    try {
      await api.withRemultAsync({} as any, async () => {
        throw Error('the error')
      })
    } catch (err) {
      error = true
      expect(err).toMatchInlineSnapshot(`[Error: the error]`)
    }
    expect(error).toBe(true)
  })
  it('api with remult provides sensible error in get user', async () => {
    const api = remultApi({
      getUser: async (req) => {
        throw Error('get user error')
      },
      initApi: async (req) => {},
      entities: [],
    })
    let error = false
    try {
      await api.withRemultAsync({} as any, async () => {
        throw Error('the error')
      })
    } catch (err) {
      error = true
      expect(err).toMatchInlineSnapshot(`[Error: get user error]`)
    }
    expect(error).toBe(true)
  })
})
