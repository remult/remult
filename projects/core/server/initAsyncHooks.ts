import { AsyncLocalStorage } from 'async_hooks'
import { RemultAsyncLocalStorage } from '../src/context.js'
import { remultStatic } from '../src/remult-static.js'

let init = false

export function initAsyncHooks() {
  if (init) return
  init = true
  remultStatic.asyncContext = new RemultAsyncLocalStorage(
    new AsyncLocalStorage(),
  )
}
