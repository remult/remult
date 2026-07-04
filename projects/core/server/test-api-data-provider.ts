import {
  InMemoryDataProvider,
  remult,
  RestDataProvider,
  type EntityMetadata,
  Remult,
} from '../index.js'
import type { RemultServerOptions } from './index.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
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
      buildGenericRequestInfo: (req) => ({
        internal: req,
        public: { headers: new Headers() },
      }),
      ignoreAsyncStorage: true,
    },
  ) as RemultServerImplementation<GenericRequestInfo & { body?: any }>

  const lock = new AsyncLock()
  // serialized so concurrent first calls don't race ensureSchema
  let schemaQueue: Promise<void> = Promise.resolve()
  function ensureSchemaSerialized() {
    const run = schemaQueue
      .catch(() => {})
      .then(async () => {
        if (newEntities.length > 0 && options?.ensureSchema != false) {
          await (await dp).ensureSchema?.(newEntities)
          newEntities = []
        }
      })
    schemaQueue = run
    return run
  }
  async function handleOnServer(
    req: GenericRequestInfo & { body?: any; user?: unknown },
  ) {
    const call = async () => {
      await ensureSchemaSerialized()
      var result = await server.handle(req)
      if ((result?.statusCode ?? 200) >= 400) {
        throw { ...result?.data, status: result?.statusCode ?? 500 }
      }
      return result?.data ? JSON.parse(JSON.stringify(result.data)) : undefined
    }
    if (remultStatic.asyncContext.hasRealAsyncStorage()) {
      // nested ALS run is concurrency-safe, no lock needed
      req.user = { ...remult.user! }
      return remultStatic.asyncContext.run(new Remult(), call)
    }
    // no ALS (e.g. StackBlitz): swapping globals is only safe one call at a time
    return lock.runExclusive(() => MakeServerCallWithDifferentStaticRemult(call))
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
      isStub: true, // keep hasRealAsyncStorage() false while this fake is installed
    })
    return await what()
  } finally {
    remultStatic.asyncContext = x
    remultStatic.remultFactory = y
  }
}
