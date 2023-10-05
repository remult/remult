import type { DataProvider } from '../src/data-interfaces.js'

export function initDataProvider(
  optionsDataProvider?:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>),
) {
  let dataProvider: Promise<DataProvider>
  if (typeof optionsDataProvider === 'function') {
    dataProvider = optionsDataProvider()
  } else dataProvider = Promise.resolve(optionsDataProvider)

  dataProvider = dataProvider.then(async (dp) => {
    if (dp) return dp
    return new (await import('./JsonEntityFileStorage.js')).JsonFileDataProvider(
      './db',
    )
  })
  return dataProvider
}
