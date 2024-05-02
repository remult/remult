import { AsyncLocalStorage } from 'async_hooks'
import { describe, expect, it } from 'vitest'
import {
  BackendMethod,
  Entity,
  Fields,
  InMemoryDataProvider,
  describeClass,
  remult,
  withRemult,
} from '../core'
import { Remult, RemultAsyncLocalStorage } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'
import { describeBackendMethods } from '../core/src/remult3/classDescribers.js'

describe('backend method context awareness', () => {
  it('getting error when async was initialized', async () => {
    let ok = true
    try {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(
        new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
      )
      RemultAsyncLocalStorage.enable()
      if (remult.authenticated()) {
      }
      ok = false
    } catch {
      ok = true
    } finally {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
      RemultAsyncLocalStorage.disable()
    }
    expect(ok).toBe(true)
  })
  it('test run works', async () => {
    try {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(
        new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
      )
      RemultAsyncLocalStorage.enable()
      let ok = false
      await withRemult(
        async () => {
          let x = remult.user
          ok = true
        },
        {
          dataProvider: new InMemoryDataProvider(),
        },
      )
      expect(ok).toBe(true)
    } finally {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
      RemultAsyncLocalStorage.disable()
    }
  })
  it('test run works and returns', async () => {
    try {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(
        new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
      )
      RemultAsyncLocalStorage.enable()
      let ok = false
      expect(
        await withRemult(
          async () => {
            let x = remult.user
            ok = true
            return 77
          },
          {
            dataProvider: new InMemoryDataProvider(),
          },
        ),
      ).toBe(77)
      expect(ok).toBe(true)
    } finally {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
      RemultAsyncLocalStorage.disable()
    }
  })
  it('test run works and returns Promise', async () => {
    try {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(
        new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
      )
      RemultAsyncLocalStorage.enable()
      let ok = false
      expect(
        await withRemult(
          async () => {
            remult.dataProvider = new InMemoryDataProvider()
            var c = class {
              id = 0
            }
            describeClass(c, Entity(''), {
              id: Fields.integer(),
            })
            await remult.repo(c).insert([{ id: 1 }, { id: 2 }])
            ok = true
            return await remult.repo(c).count()
          },
          {
            dataProvider: new InMemoryDataProvider(),
          },
        ),
      ).toBe(2)
      expect(ok).toBe(true)
    } finally {
      remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
      RemultAsyncLocalStorage.disable()
    }
  })

  it('testing ', async () => {
    let wasCalled = false
    let c = class {
      static async testingContextAwareness() {
        wasCalled = true
      }
    }
    describeBackendMethods(c, {
      testingContextAwareness: { allowed: false },
    })
    await withRemult(
      async () => {
        remult.dataProvider = new InMemoryDataProvider()
        c.testingContextAwareness()
      },
      {
        dataProvider: new InMemoryDataProvider(),
      },
    )
    expect(wasCalled).toBe(true)
  })
})
