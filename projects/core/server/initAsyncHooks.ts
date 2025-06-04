import { AsyncLocalStorage } from 'async_hooks'
import {
  RemultAsyncLocalStorage,
  type RemultAsyncLocalStorageCore,
} from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

let init = false

/**
 * Initializes async context tracking for the server.
 * 
 * This should be called before handling any incoming requests or calling `withRemult()`.
 * @example
 * import { initAsyncHooks } from 'remult/async-hooks';
 * initAsyncHooks();
 */
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

export class AsyncLocalStorageBridgeToRemultAsyncLocalStorageCoreImpl<T>
  implements RemultAsyncLocalStorageCore<T>
{
  private asyncLocalStorage = new AsyncLocalStorage<T>()

  wasImplemented = 'yes' as const
  run<R>(store: T, callback: () => Promise<R>): Promise<R> {
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
  getStore(): T | undefined {
    return this.asyncLocalStorage.getStore()
  }
}

export class StubRemultAsyncLocalStorageCore<T>
  implements RemultAsyncLocalStorageCore<T>
{
  isStub = true
  wasImplemented = 'yes' as const
  async run<R>(store: T, callback: () => Promise<R>): Promise<R> {
    this.currentValue = store
    return await callback()
  }

  getStore(): T | undefined {
    return this.currentValue
  }

  lastPromise: Promise<T | undefined> = Promise.resolve(undefined)
  currentValue?: T
}

export class AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore<
  T,
> extends AsyncLocalStorageBridgeToRemultAsyncLocalStorageCoreImpl<T> {}
