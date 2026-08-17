import {
  InMemoryDataProvider,
  remult,
  RestDataProvider,
  SqlDatabase,
  type DataProvider,
  type EntityMetadata,
  type UserInfo,
} from '../index.js'
import type { RemultServerOptions } from './index.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
  type RemultServerImplementation,
} from './remult-api-server.js'
import { initDataProvider } from './initDataProvider.js'
import { initAsyncHooks } from './initAsyncHooks.js'

type TestApiRequest = GenericRequestInfo & { body?: any; user?: UserInfo }

export function TestApiDataProvider(
  options?: Pick<RemultServerOptions<unknown>, 'ensureSchema' | 'dataProvider'>,
) {
  if (!options) options = {}
  // `createRemultServerCore` skips it - without it the in-process call has no
  // remult of its own and would corrupt the caller's context
  initAsyncHooks()

  var dp = initDataProvider(options.dataProvider, false, async () => {
    return new InMemoryDataProvider()
  })

  const server = createRemultServerCore<TestApiRequest>(
    { ...options, dataProvider: dp, getUser: async (req) => req.user },
    {
      getRequestBody: async (req) => req.body,
      buildGenericRequestInfo: (req) => ({
        internal: req,
        public: { headers: new Headers() },
      }),
      ignoreAsyncStorage: true,
    },
  ) as RemultServerImplementation<TestApiRequest>

  // concurrent first calls would otherwise race on ensureSchema
  const schemaLock = new AsyncLock()

  async function handleOnServer(req: TestApiRequest) {
    req.user = remult.user ? { ...remult.user } : undefined
    await schemaLock.runExclusive(async () => {
      if (newEntities.length > 0 && options?.ensureSchema != false) {
        await (await dp).ensureSchema?.(newEntities)
        newEntities = []
      }
    })
    var result = await server.handle(req)
    if ((result?.statusCode ?? 200) >= 400) {
      throw { ...result?.data, status: result?.statusCode ?? 500 }
    }
    return result?.data ? JSON.parse(JSON.stringify(result.data)) : undefined
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
export class AsyncLock {
  static enabled = true
  private current: Promise<void> = Promise.resolve()
  i = 0

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.current

    let resolveNext: () => void
    this.current = new Promise<void>((resolve) => (resolveNext = resolve))

    if (AsyncLock.enabled) await previous
    try {
      return await fn()
    } finally {
      resolveNext!()
    }
  }
}
