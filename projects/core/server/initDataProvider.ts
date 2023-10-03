import type { DataProvider } from '../src/data-interfaces'

export function initDataProvider(
  optionsDataProvider?:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>),
): Promise<DataProvider> {
  let dataProvider: Promise<DataProvider | undefined>
  if (typeof optionsDataProvider === 'function') {
    dataProvider = optionsDataProvider()
  } else dataProvider = Promise.resolve(optionsDataProvider)

  dataProvider = dataProvider.then(async (dp) => {
    if (dp) return dp
    return new (await import('./JsonEntityFileStorage')).JsonFileDataProvider(
      './db',
    )
  })
  return dataProvider as Promise<DataProvider>
}
