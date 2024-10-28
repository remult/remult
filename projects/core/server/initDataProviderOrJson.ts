import type { DataProvider } from '../src/data-interfaces.js'
import { initDataProvider } from './initDataProvider.js'

export function initDataProviderOrJson(
  dataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
    | undefined,
): Promise<DataProvider> {
  return initDataProvider(dataProvider, false, async () => {
    return new (
      await import('./JsonEntityFileStorage.js')
    ).JsonFileDataProvider('./db')
  })
}
