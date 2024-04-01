import { AsyncLocalStorage } from 'async_hooks'
import { RemultAsyncLocalStorage, type RemultAsyncLocalStorageCore } from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

let init = false

export function initAsyncHooks() {
  if (init) return
  init = true
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(new AsyncLocalStorage()),
  )
}

class AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore<T> implements RemultAsyncLocalStorageCore<T>{
  constructor(private asyncLocalStorage: AsyncLocalStorage<T>) {
  }
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
    return r;
  }
  getStore(): T {
    return this.asyncLocalStorage.getStore()
  }

}