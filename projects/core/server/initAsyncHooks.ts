import { AsyncLocalStorage } from 'async_hooks'
import {
  RemultAsyncLocalStorage,
  type RemultAsyncLocalStorageCore,
} from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

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

const ignoreInStack = [
  'AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore.run',
  'RemultAsyncLocalStorage.run',
  'Module.withRemult',
  'RemultServerImplementation.runWithRemult',
]
export class SequentialRemultAsyncLocalStorageCore<T>
  implements RemultAsyncLocalStorageCore<T>
{
  wasImplemented = 'yes' as const
  async run<R>(store: T, callback: () => Promise<R>): Promise<R> {
    let log = (msg: string) => {}
    if (false) {
      let stack = new Error().stack
      let y = stack!.split('\n')
      while (
        y.length > 0 &&
        (y[0].trim().startsWith('Error') ||
          ignoreInStack.includes(y[0].trim().split(' ')[1]))
      ) {
        y.splice(0, 1)
      }
      stack = y.join('\n')
      log = (msg: string) => {
        console.log(msg, stack)
      }
    }
    log('waiting on ')
    const nextPromise = this.lastPromise.then(async () => {
      log('executing  ')
      const previousValue = this.currentValue
      this.currentValue = store

      const result = await callback()
      this.currentValue = previousValue
      return result
    })
    this.lastPromise = nextPromise.catch(() => {
      log('Error on ')
      return undefined
    }) as unknown as Promise<T>

    try {
      return await nextPromise
    } finally {
      log('completed  ')
    }
  }

  getStore(): T | undefined {
    return this.currentValue
  }

  lastPromise: Promise<T | undefined> = Promise.resolve(undefined)
  currentValue?: T
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
