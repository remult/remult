import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BackendMethod,
  Entity,
  Fields,
  InMemoryDataProvider,
  asApiClient,
  remult,
  repo,
  withRemult,
} from '../core/index.js'
import type { ExternalHttpProvider } from '../core/src/buildRestDataProvider.js'
import { RemultAsyncLocalStorage } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'
import { createRemultServerCore } from '../core/server/remult-api-server.js'

@Entity<Task>('apiModeTasks', {
  allowApiCrud: true,
  apiPrefilter: () => (remult.isAllowed('admin') ? {} : { pub: true }),
})
class Task {
  @Fields.integer()
  id = 0
  @Fields.boolean()
  pub = false
  @Fields.string({ includeInApi: 'admin' })
  secret = ''
}

class Methods {
  @BackendMethod({ allowed: 'admin' })
  static async adminOnly() {
    return 'ran'
  }
  @BackendMethod({ allowed: true })
  static async countAll() {
    return repo(Task).count()
  }
}

const rows = () =>
  repo(Task)
    .find()
    .then((r) => r.map((t) => `${t.id}:${t.secret ?? ''}`))

/** the server side of the story: async storage on, api mounted, one request remult */
function useServer() {
  let db: InMemoryDataProvider
  beforeEach(async () => {
    db = new InMemoryDataProvider()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    remultStatic.apiClientScope.core =
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore()
    RemultAsyncLocalStorage.enable()
    createRemultServerCore<any>(
      { entities: [Task], controllers: [Methods], dataProvider: db },
      {
        getRequestBody: async (req) => req.body,
        buildGenericRequestInfo: (req) => ({
          internal: req,
          public: { headers: new Headers() },
        }),
        ignoreAsyncStorage: true,
      },
    )
    await withRemult(
      async () => {
        await repo(Task).insert([
          { id: 1, pub: true, secret: 's1' },
          { id: 2, pub: false, secret: 's2' },
        ])
      },
      { dataProvider: db },
    )
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.apiClientScope.core = undefined
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
    remultStatic.buildInProcessHttpClient = undefined
    remultStatic.actionInfo.runningOnServer = false
  })
  return {
    request: <T>(user: any, what: () => Promise<T>) =>
      withRemult(
        async () => {
          remult.user = user
          return what()
        },
        { dataProvider: db },
      ),
    get db() {
      return db
    },
  }
}

describe('asApiClient - in process', () => {
  const server = useServer()

  it('the global repo() switches to api rules inside the scope, and back after', async () => {
    await server.request({ id: 'u' }, async () => {
      expect(await rows()).toEqual(['1:s1', '2:s2'])
      expect(await asApiClient(rows)).toEqual(['1:'])
      expect(await rows()).toEqual(['1:s1', '2:s2'])
    })
  })

  it('carries the user, so an admin sees what an admin may see', async () => {
    await server.request({ id: 'a', roles: ['admin'] }, async () => {
      expect(await asApiClient(rows)).toEqual(['1:s1', '2:s2'])
    })
  })

  it('BackendMethod goes through the api, so allowed is enforced', async () => {
    await server.request({ id: 'u' }, async () => {
      expect(await Methods.adminOnly()).toBe('ran')
      await expect(
        asApiClient(() => Methods.adminOnly()),
      ).rejects.toMatchObject({ httpStatusCode: 403 })
      expect(await asApiClient(() => Methods.countAll())).toBe(2)
    })
  })

  it('writes are gated too', async () => {
    await server.request({ id: 'u' }, async () => {
      await expect(
        asApiClient(() => repo(Task).insert({ id: 3 })),
      ).resolves.toMatchObject({ id: 3 })
      await expect(
        asApiClient(() => repo(Task).update(2, { secret: 'hacked' })),
      ).rejects.toBeDefined()
    })
  })

  it('concurrent requests do not leak their scope into each other', async () => {
    const slow = server.request({ id: 'u' }, async () => {
      const inScope = asApiClient(async () => {
        await new Promise((r) => setTimeout(r, 20))
        return rows()
      })
      return inScope
    })
    const fast = server.request({ id: 'u' }, () => rows())
    expect(await Promise.all([slow, fast])).toEqual([
      ['1:'],
      ['1:s1', '2:s2'],
    ])
  })

  it('nested withRemult inside a scope gets the real database back', async () => {
    await server.request({ id: 'u' }, async () => {
      await asApiClient(async () => {
        expect(await rows()).toEqual(['1:'])
        await withRemult(
          async () => expect(await rows()).toEqual(['1:s1', '2:s2']),
          { dataProvider: server.db },
        )
      })
    })
  })
})

describe('asApiClient - fetch transport', () => {
  const server = useServer()

  it('uses the fetch it is given', async () => {
    const calls: string[] = []
    const inProcess =
      remultStatic.buildInProcessHttpClient!() as ExternalHttpProvider
    const fetch = {
      get: (url: string) => {
        calls.push(url)
        return inProcess.get(url)
      },
      put: inProcess.put,
      post: inProcess.post,
      delete: inProcess.delete,
    }
    await server.request({ id: 'u' }, async () => {
      expect(await asApiClient(rows, { fetch })).toEqual(['1:'])
    })
    expect(calls.length).toBe(1)
    expect(calls[0]).toContain('/api/apiModeTasks')
  })
})

describe('asApiClient - browser', () => {
  it('is a no-op, because reads there already go through the api', async () => {
    remultStatic.actionInfo.runningOnServer = false
    let ran = false
    const r = await asApiClient(async () => {
      ran = true
      return 42
    })
    expect(ran).toBe(true)
    expect(r).toBe(42)
  })
})
