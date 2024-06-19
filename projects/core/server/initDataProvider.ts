import type { DataProvider } from '../src/data-interfaces.js'
import { remultStatic } from '../src/remult-static.js'

export function initDataProvider(
  optionsDataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
    | undefined,
  useStaticDefault: boolean,
  defaultDataProvider: () => Promise<DataProvider>,
): Promise<DataProvider> {
  let dataProvider: Promise<DataProvider | undefined>
  if (typeof optionsDataProvider === 'function') {
    dataProvider = optionsDataProvider()
  } else dataProvider = Promise.resolve(optionsDataProvider)

  dataProvider = dataProvider.then(async (dp) => {
    if (dp) return dp
    if (useStaticDefault) dp = await remultStatic.defaultDataProvider()
    if (dp) return dp
    return defaultDataProvider?.()
  })
  return dataProvider as Promise<DataProvider>
}
