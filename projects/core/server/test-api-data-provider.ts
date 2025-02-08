import {
  InMemoryDataProvider,
  remult,
  RestDataProvider,
  SqlDatabase,
  type DataProvider,
  type EntityMetadata,
  type Remult,
} from '../index.js'
import type { RemultServerOptions, GenericRequestInfo } from './index.js'
import {
  createRemultServerCore,
  type RemultServerImplementation,
} from './remult-api-server.js'
import { remultStatic } from '../src/remult-static.js'
import { RemultAsyncLocalStorage } from '../src/context.js'
import { initDataProvider } from './initDataProvider.js'

export function TestApiDataProvider(
  options?: Pick<RemultServerOptions<unknown>, 'ensureSchema' | 'dataProvider'>,
) {
  if (!options) options = {}

  var dp = initDataProvider(options.dataProvider, false, async () => {
    return new InMemoryDataProvider()
  })

  const server = createRemultServerCore<GenericRequestInfo & { body?: any }>(
    { ...options, dataProvider: dp },
    {
      getRequestBody: async (req) => req.body,
      buildGenericRequestInfo: (req) => req,
      ignoreAsyncStorage: true,
    },
  ) as RemultServerImplementation<GenericRequestInfo & { body?: any }>

  async function handleOnServer(req: GenericRequestInfo & { body?: any }) {
    return await MakeServerCallWithDifferentStaticRemult(async () => {
      if (newEntities.length > 0 && options?.ensureSchema != false) {
        await (await dp).ensureSchema?.(newEntities)
        newEntities = []
      }
      var result = await server.handle(req)
      if ((result?.statusCode ?? 200) >= 400) {
        throw { ...result?.data, status: result?.statusCode ?? 500 }
      }
      return result?.data
    })
  }

  const registeredEntities = new Set<string>()
  let newEntities: EntityMetadata[] = []
  return new RestDataProvider(
    () => ({
      httpClient: {
        get: (url) =>
          handleOnServer({
            url: url,
            method: 'GET',
          }),
        put: (url, body) =>
          handleOnServer({
            method: 'PUT',
            url: url,
            body: body,
          }),
        post: (url, body) =>
          handleOnServer({
            method: 'POST',
            url: url,
            body,
          }),
        delete: (url) =>
          handleOnServer({
            method: 'DELETE',
            url: url,
          }),
      },
    }),
    (entity) => {
      if (!registeredEntities.has(entity.key)) {
        registeredEntities.add(entity.key)
        server.__addEntityForTesting(entity)
        newEntities.push(entity)
      }
    },
  )
}

async function MakeServerCallWithDifferentStaticRemult<T>(what: () => T) {
  var x = remultStatic.asyncContext
  var y = remultStatic.remultFactory
  const user = { ...remult.user! }
  let store: {
    remult: Remult
    inInitRequest?: boolean
  }
  remultStatic.remultFactory = () => store.remult
  try {
    remultStatic.asyncContext = new RemultAsyncLocalStorage({
      getStore: () => store,
      run: (pStore, callback) => {
        store = pStore
        store.remult.user = user
        return callback()
      },
      wasImplemented: 'yes',
    })
    return await what()
  } finally {
    remultStatic.asyncContext = x
    remultStatic.remultFactory = y
  }
}
