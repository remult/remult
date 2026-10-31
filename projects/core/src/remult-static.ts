import type { ClassType } from '../classType.js'
import type { ClassHelper, Remult, RemultAsyncLocalStorage } from './context.js'
import type { DataProvider } from './data-interfaces.js'
import type { columnInfo } from './remult3/columnInfo.js'

const remultStaticKey = Symbol.for('remult-static1')

let x = {
  defaultRemultFactory: undefined as unknown as () => Remult,
  remultFactory: undefined as unknown as () => Remult,
  defaultRemult: undefined as unknown as Remult,
  asyncContext: undefined as unknown as RemultAsyncLocalStorage,
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
  fieldOptionsEnricher: undefined as unknown as any,
  labelTransformer: undefined as unknown as any,
  defaultIdFactory: undefined as unknown as () => string,
  defaultDataProvider: () =>
    undefined as unknown as Promise<DataProvider | undefined>,
}

if (
  (typeof process !== 'undefined' &&
    process.env['IGNORE_GLOBAL_REMULT_IN_TESTS']) ||
  typeof (globalThis as any)[remultStaticKey] === 'undefined'
) {
  ;(globalThis as any)[remultStaticKey] = x
  x.remultFactory = () => defaultFactory()
} else {
  x = (globalThis as any)[remultStaticKey]
}
export const remultStatic = x

export function defaultFactory() {
  if (!remultStatic.defaultRemult) {
    remultStatic.defaultRemult = remultStatic.defaultRemultFactory()
  }
  return remultStatic.defaultRemult
}
export function resetFactory() {
  remultStatic.remultFactory = () => defaultFactory()
}
