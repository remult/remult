import { AsyncLocalStorage } from 'async_hooks'
import { RemultAsyncLocalStorage, type RemultAsyncLocalStorageCore } from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

let init = false

export function initAsyncHooks() {
  if (init) return
  init = true
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
  )
}

export class AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore<T> implements RemultAsyncLocalStorageCore<T>{
  private asyncLocalStorage = new AsyncLocalStorage<T>()

  wasImplemented: 'yes'
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
export class SequentialRemultAsyncLocalStorageCore<T> implements RemultAsyncLocalStorageCore<T>{
  wasImplemented: 'yes'
  async run<R>(store: T, callback: () => Promise<R>): Promise<R> {
    let result: R;
    const nextPromise = this.lastPromise.then(async () => {
      const previousValue = this.currentValue;
      this.currentValue = store;
      this.lastPromise
      const result = await callback();
      this.currentValue = previousValue;
      return result;
    })
    this.lastPromise = nextPromise.catch(() => undefined);

    return await nextPromise;
  }

  getStore(): T {
    return this.currentValue;
  }

  lastPromise: Promise<T> = Promise.resolve(undefined);
  currentValue: T;
}