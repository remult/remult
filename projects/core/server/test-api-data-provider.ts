import {
  InMemoryDataProvider,
  RestDataProvider,
  SqlDatabase,
  type EntityMetadata,
} from '../index.js'
import type { RemultServerOptions } from './index.js'
import { remultStatic } from '../src/remult-static.js'
import {
  RemultAsyncLocalStorage,
  type RemultAsyncStore,
} from '../src/context.js'
import { buildInProcessHttpClient } from './in-process-api-client.js'
import type { InProcessRequest } from './in-process-request.js'
import {
  createRemultServerCore,
  type RemultServerImplementation,
} from './remult-api-server.js'
import { initDataProvider } from './initDataProvider.js'

export function TestApiDataProvider(
  options?: Pick<RemultServerOptions<unknown>, 'ensureSchema' | 'dataProvider'>,
) {
  if (!options) options = {}

  var dp = initDataProvider(options.dataProvider, false, async () => {
    return new InMemoryDataProvider()
  })

  const server = createRemultServerCore<InProcessRequest>(
    { ...options, dataProvider: dp },
    {
      getRequestBody: async (req) => req.body,
      buildGenericRequestInfo: (req) => ({
        internal: req,
        public: { headers: new Headers() },
      }),
      ignoreAsyncStorage: true,
    },
  ) as RemultServerImplementation<InProcessRequest>
  const httpClient = buildInProcessHttpClient(server)

  // With real async storage the api's own `withRemult` isolates the call. Without
  // it - a plain unit test - it never becomes ambient, so the call would run on
  // the caller's remult and read its context; swapping the factory stands in for
  // that, and has to be serialized because it is process wide.
  const swapLock = new AsyncLock()
  const isolate = <T>(what: () => Promise<T>) =>
    remultStatic.asyncContext.hasStorage()
      ? what()
      : swapLock.runExclusive(() => withOwnAmbientRemult(what))

  // concurrent first calls would otherwise race on ensureSchema
  const schemaLock = new AsyncLock()
  const ensureSchema = () =>
    schemaLock.runExclusive(async () => {
      if (newEntities.length > 0 && options?.ensureSchema != false) {
        await (await dp).ensureSchema?.(newEntities)
        newEntities = []
      }
    })

  const registeredEntities = new Set<string>()
  let newEntities: EntityMetadata[] = []
  return new RestDataProvider(
    () => ({
      httpClient: {
        get: async (url) => (
          await ensureSchema(),
          isolate(() => httpClient.get(url))
        ),
        put: async (url, body) => (
          await ensureSchema(),
          isolate(() => httpClient.put(url, body))
        ),
        post: async (url, body) => (
          await ensureSchema(),
          isolate(() => httpClient.post(url, body))
        ),
        delete: async (url) => (
          await ensureSchema(),
          isolate(() => httpClient.delete(url))
        ),
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

async function withOwnAmbientRemult<T>(what: () => Promise<T>): Promise<T> {
  const asyncContext = remultStatic.asyncContext
  const remultFactory = remultStatic.remultFactory
  let store: RemultAsyncStore | undefined
  // until the api opens its own remult, `remult` still means the caller's
  remultStatic.remultFactory = () => store?.remult ?? remultFactory()
  try {
    remultStatic.asyncContext = new RemultAsyncLocalStorage({
      getStore: () => store,
      run: (pStore, callback) => {
        store = pStore
        return callback()
      },
      wasImplemented: 'yes',
    })
    return await what()
  } finally {
    remultStatic.asyncContext = asyncContext
    remultStatic.remultFactory = remultFactory
  }
}
