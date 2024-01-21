import type { Remult } from '..'
import type { RemultAsyncLocalStorage } from './context.js'

const remultStaticKey = Symbol.for('remult-static1')

let x = {
  defaultRemultFactory: undefined as () => Remult,
  defaultRemult: undefined as Remult,
  asyncContext: undefined as RemultAsyncLocalStorage,
}

if (
  process.env['IGNORE_GLOBAL_REMULT_IN_TESTS'] ||
  typeof globalThis[remultStaticKey] === 'undefined'
) {
  globalThis[remultStaticKey] = x
} else {
  x = globalThis[remultStaticKey]
}

export const remultStatic = x

export function defaultFactory() {
  if (!remultStatic.defaultRemult) {
    remultStatic.defaultRemult = remultStatic.defaultRemultFactory()
  }
  return remultStatic.defaultRemult
}
