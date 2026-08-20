import { AsyncLocalStorage } from 'async_hooks'
import {
  RemultAsyncLocalStorage,
  type RemultAsyncLocalStorageCore,
} from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

export function initAsyncHooks() {
  const remultStorageAlreadySet = remultStatic.asyncContext?.hasStorage()
  // the two storages are wired independently: a hand-wired asyncContext must not
  // leave the data scope without one, or scopes degrade to save/restore
  if (remultStorageAlreadySet && remultStatic.dataScope.core) return
  if (!remultStorageAlreadySet)
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
  remultStatic.dataScope.core ??=
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore()
  let test = new AsyncLocalStorage()
  test.run(1, async () => {
    await Promise.resolve()
    if (test.getStore() === undefined) {
      console.log(
        "async_hooks.AsyncLocalStorage not working, using stub implementation (You're probably running on stackblitz, this will work on a normal nodejs environment)",
      )
      if (!remultStorageAlreadySet)
        remultStatic.asyncContext = new RemultAsyncLocalStorage(
          new StubRemultAsyncLocalStorageCore(),
        )
      remultStatic.dataScope.core = undefined
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
