import { AsyncLocalStorage } from 'async_hooks'
import {
  RemultAsyncLocalStorage,
  type RemultAsyncLocalStorageCore,
  type RemultInAsyncLocalStorage,
} from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'
import type { DataProvider } from '../src/data-interfaces.js'

let init = false

export function initAsyncHooks() {
  if (init) return
  init = true
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
  )
  let test = new AsyncLocalStorage()
  test.run(1, async () => {
    await Promise.resolve()
    if (test.getStore() === undefined) {
      console.log(
        "async_hooks.AsyncLocalStorage not working, using stub implementation (You're probably running on stackblitz, this will work on a normal nodejs environment)",
      )
      remultStatic.asyncContext = new RemultAsyncLocalStorage(
        new StubRemultAsyncLocalStorageCore(),
      )
    }
  })
}

export class AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore
  implements RemultAsyncLocalStorageCore
{
  private asyncLocalStorage = new AsyncLocalStorage<RemultInAsyncLocalStorage>()

  wasImplemented = 'yes' as const
  run<R>(
    store: RemultInAsyncLocalStorage,
    callback: () => Promise<R>,
  ): Promise<R> {
    let r: Promise<R>
    this.asyncLocalStorage.run(store, () => {
      r = new Promise<R>(async (res, rej) => {
        try {
          res(await callback())
        } catch (err) {
          rej(err)
        }
      })
    })
    return r!
  }
  getStore(): RemultInAsyncLocalStorage | undefined {
    return this.asyncLocalStorage.getStore()
  }
  createDataProviderAsyncLocalStorage() {
    return new AsyncLocalStorage<{ dataProvider: DataProvider }>()
  }
}

export class StubRemultAsyncLocalStorageCore
  implements RemultAsyncLocalStorageCore
{
  createDataProviderAsyncLocalStorage() {
    return undefined
  }
  isStub = true
  wasImplemented = 'yes' as const
  async run<R>(
    store: RemultInAsyncLocalStorage,
    callback: () => Promise<R>,
  ): Promise<R> {
    this.currentValue = store
    return await callback()
  }

  getStore(): RemultInAsyncLocalStorage | undefined {
    return this.currentValue
  }

  lastPromise: Promise<RemultInAsyncLocalStorage | undefined> =
    Promise.resolve(undefined)
  currentValue?: RemultInAsyncLocalStorage
}
