import type { ClassType } from '../classType.js'
import type { ClassHelper, Remult, RemultAsyncLocalStorage } from './context.js'
import type { columnInfo } from './remult3/columnInfo.js'
import type { EntityMetadata } from './remult3/remult3.js'

const remultStaticKey = Symbol.for('remult-static1')

let x = {
  defaultRemultFactory: undefined as () => Remult,
  defaultRemult: undefined as Remult,
  asyncContext: undefined as RemultAsyncLocalStorage,
  columnsOfType: new Map<any, columnInfo[]>(),
  allEntities: [] as ClassType<any>[],
  classHelpers: new Map<any, ClassHelper>(),
  actionInfo: {
    allActions: [] as any[],
    runningOnServer: false,
    runActionWithoutBlockingUI: <T>(what: () => Promise<T>): Promise<T> => {
      return what()
    },
    startBusyWithProgress: () => ({
      progress: (percent: number) => {},
      close: () => {},
    }),
  },
  captionTransformer: undefined as any,
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
