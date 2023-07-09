import { DataProvider } from '../src/data-interfaces'

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
    return new (await import('./JsonEntityFileStorage')).JsonFileDataProvider(
      './db',
    )
  })
  return dataProvider
}
