import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
  remult,
  repo,
  withRemult,
  withDataProvider,
  withFetch,
  type DataProvider,
} from '../core/index.js'
import { RemultAsyncLocalStorage, doTransaction } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'

@Entity('scopedDpTasks', { allowApiCrud: true })
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => (resolve = res))
  return { promise, resolve }
}

describe('withDataProvider with real async storage', () => {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
  })

  it('scopes data access, keeps the ambient remult identity', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    await withRemult(
      async () => {
        remult.user = { id: 'u1' }
        await repo(Task).insert({ id: 1, title: 'in A' })

        await withDataProvider(dbB, async () => {
          expect(remult.user?.id).toBe('u1') // same remult, same user
          expect(await repo(Task).count()).toBe(0) // reads B, not A
          await repo(Task).insert({ id: 2, title: 'in B' })
        })

        expect(await repo(Task).count()).toBe(1) // back to A
      },
      { dataProvider: dbA },
    )
    await withRemult(async () => expect(await repo(Task).count()).toBe(1), {
      dataProvider: dbB,
    })
  })

  it('an inner withRemult dataProvider wins over an outer scope', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    const dbC = new InMemoryDataProvider()
    await withRemult(
      async () => {
        await withDataProvider(dbB, async () => {
          await repo(Task).insert({ id: 1 })
          await withRemult(
            async () => {
              expect(await repo(Task).count()).toBe(0) // sees C, not B
              await repo(Task).insert({ id: 2 })
            },
            { dataProvider: dbC },
          )
          expect(await repo(Task).count()).toBe(1) // back to B
        })
        expect(await repo(Task).count()).toBe(0) // back to A
      },
      { dataProvider: dbA },
    )
  })

  it('remult.dataProvider reads honor the scope, assignment sets the instance', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    const dbC = new InMemoryDataProvider()
    await withRemult(
      async () => {
        await withDataProvider(dbB, async () => {
          expect(remult.dataProvider).toBe(dbB)
          remult.dataProvider = dbC // writes the instance default
          expect(remult.dataProvider).toBe(dbB) // scope still wins for reads
        })
        expect(remult.dataProvider).toBe(dbC)
      },
      { dataProvider: dbA },
    )
  })

  it('doTransaction inside a scope runs on the scoped provider', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    let txOnB = 0
    const trackedB: DataProvider = {
      getEntityDataProvider: (e) => dbB.getEntityDataProvider(e),
      transaction: (action) => {
        txOnB++
        return dbB.transaction(action)
      },
    }
    await withRemult(
      async (r) => {
        await withDataProvider(trackedB, async () => {
          await doTransaction(r, async () => {
            expect(remult.dataProvider).toBe(dbB) // tx provider, innermost scope
            await repo(Task).insert({ id: 1 })
            await repo(Task).insert({ id: 2 })
          })
          expect(remult.dataProvider).toBe(trackedB) // outer scope restored
        })
        expect(await repo(Task).count()).toBe(0) // nothing landed in A
      },
      { dataProvider: dbA },
    )
    expect(txOnB).toBe(1)
    await withRemult(async () => expect(await repo(Task).count()).toBe(2), {
      dataProvider: dbB,
    })
  })

  it('a failed doTransaction inside a scope rolls back on the scoped provider', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    await withRemult(
      async (r) => {
        await withDataProvider(dbB, async () => {
          await expect(
            doTransaction(r, async () => {
              await repo(Task).insert({ id: 1 })
              throw new Error('rollback')
            }),
          ).rejects.toThrow('rollback')
        })
      },
      { dataProvider: dbA },
    )
    await withRemult(async () => expect(await repo(Task).count()).toBe(0), {
      dataProvider: dbB,
    })
  })

  it('concurrent requests each keep their own scope', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    const dbShared = new InMemoryDataProvider()
    const aStarted = deferred()
    const releaseA = deferred()
    const gatedB: DataProvider = {
      getEntityDataProvider: (e) => {
        const inner = dbB.getEntityDataProvider(e)
        return {
          ...inner,
          count: inner.count.bind(inner),
          groupBy: inner.groupBy?.bind(inner),
          update: inner.update.bind(inner),
          delete: inner.delete.bind(inner),
          insert: inner.insert.bind(inner),
          find: async (options) => {
            aStarted.resolve()
            await releaseA.promise
            return inner.find(options)
          },
        }
      },
      transaction: (action) => dbB.transaction(action),
    }

    const requestA = withRemult(
      async () => {
        remult.user = { id: 'A' }
        return withDataProvider(gatedB, async () => {
          const rows = await repo(Task).find()
          return { user: remult.user?.id, rows: rows.length }
        })
      },
      { dataProvider: dbShared },
    )

    const requestB = (async () => {
      await aStarted.promise // enter while A's scoped find is in flight
      return withRemult(
        async () => {
          remult.user = { id: 'B' }
          await repo(Task).insert({ id: 9 })
          return { user: remult.user?.id, count: await repo(Task).count() }
        },
        { dataProvider: dbA },
      )
    })()

    const b = await requestB
    releaseA.resolve()
    const a = await requestA

    expect(a).toEqual({ user: 'A', rows: 0 }) // A saw gated dbB, kept its user
    expect(b).toEqual({ user: 'B', count: 1 }) // B unaffected by A's scope
  })

  it('withFetch routes reads through the http client, same user', async () => {
    const dbA = new InMemoryDataProvider()
    const calls: string[] = []
    const http = {
      get: async (url: string) => {
        calls.push(url)
        return [{ id: 7, title: 'from api' }]
      },
      post: async () => ({}),
      put: async () => ({}),
      delete: async () => {},
    }
    await withRemult(
      async () => {
        remult.user = { id: 'u1' }
        const rows = await withFetch(http, async () => {
          expect(remult.user?.id).toBe('u1')
          return repo(Task).find()
        })
        expect(rows.map((r) => r.id)).toEqual([7])
        expect(calls).toEqual(['/api/scopedDpTasks'])
        expect(await repo(Task).count()).toBe(0) // back to A
      },
      { dataProvider: dbA },
    )
  })

  it('withFetch url option overrides the default api root', async () => {
    const calls: string[] = []
    const http = {
      get: async (url: string) => {
        calls.push(url)
        return []
      },
      post: async () => ({}),
      put: async () => ({}),
      delete: async () => {},
    }
    await withRemult(
      async () => {
        await withFetch(http, () => repo(Task).find(), { url: '/custom' })
        expect(calls).toEqual(['/custom/scopedDpTasks'])
      },
      { dataProvider: new InMemoryDataProvider() },
    )
  })
})

describe('withDataProvider without async storage (fallback)', () => {
  it('swaps and restores on the current remult', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    const prev = remult.dataProvider
    try {
      remult.dataProvider = dbA
      await repo(Task).insert({ id: 1 })
      await withDataProvider(dbB, async () => {
        expect(await repo(Task).count()).toBe(0)
        await repo(Task).insert({ id: 2 })
      })
      expect(await repo(Task).count()).toBe(1)
      expect(remult.dataProvider).toBe(dbA)
    } finally {
      remult.dataProvider = prev
    }
  })

  it('restores even when the callback throws', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    const prev = remult.dataProvider
    try {
      remult.dataProvider = dbA
      await expect(
        withDataProvider(dbB, async () => {
          throw new Error('boom')
        }),
      ).rejects.toThrow('boom')
      expect(remult.dataProvider).toBe(dbA)
    } finally {
      remult.dataProvider = prev
    }
  })
})
