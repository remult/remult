import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  BackendMethod,
  Controller,
  Entity,
  Fields,
  InMemoryDataProvider,
  remult,
  repo,
  withFetch,
  withRemult,
  type DataProvider,
} from '../core/index.js'
import { RemultAsyncLocalStorage } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'
import {
  createRemultServerCore,
  type GenericRequestInfo,
  type RemultServerImplementation,
} from '../core/server/remult-api-server.js'

@Entity('withFetchTasks', { allowApiCrud: true })
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
}

@Entity<GatedTask>('withFetchGated', {
  allowApiCrud: true,
  allowApiDelete: false,
  apiPrefilter: { pub: true },
})
class GatedTask {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
  @Fields.boolean()
  pub = false
  @Fields.string({ includeInApi: false })
  secret = ''
}

class GatedMethods {
  @BackendMethod({ allowed: false })
  static async forbiddenCount() {
    return await repo(GatedTask).count()
  }
  @BackendMethod({ allowed: true })
  static async totalCount() {
    return await repo(GatedTask).count()
  }
  @BackendMethod({ allowed: true })
  static async ping() {
    return 'pong'
  }
}

@Controller('withFetchCtrl')
class GatedController {
  @Fields.string()
  note = ''
  @BackendMethod({ allowed: false })
  async forbiddenNote() {
    return this.note
  }
  @BackendMethod({ allowed: true })
  async echo() {
    return this.note + '!'
  }
}

// http client backed by a full in-process api pipeline
function apiHttpClient(dataProvider: DataProvider) {
  const server = createRemultServerCore<GenericRequestInfo & { body?: any }>(
    {
      entities: [GatedTask],
      controllers: [GatedMethods, GatedController],
      dataProvider,
    },
    {
      getRequestBody: async (req) => req.body,
      buildGenericRequestInfo: (req) => ({
        internal: req,
        public: { headers: new Headers() },
      }),
      ignoreAsyncStorage: true,
    },
  ) as RemultServerImplementation<GenericRequestInfo & { body?: any }>
  const call = async (method: string, url: string, body?: any) => {
    const r = await server.handle({ url, method, body })
    if ((r?.statusCode ?? 200) >= 400)
      throw { ...r?.data, status: r?.statusCode ?? 500 }
    return r?.data
  }
  return {
    get: (url: string) => call('GET', url),
    post: (url: string, body: any) => call('POST', url, body),
    put: (url: string, body: any) => call('PUT', url, body),
    delete: (url: string) => call('DELETE', url),
  }
}

// records the urls it was asked for, `get` answers with `rows`
function mockHttp(rows: any[] = []) {
  const calls: string[] = []
  return {
    calls,
    http: {
      get: async (url: string) => {
        calls.push(url)
        return rows
      },
      post: async (url: string) => {
        calls.push('POST ' + url)
        return {}
      },
      put: async () => ({}),
      delete: async () => {},
    },
  }
}

function useRealAsyncStorage() {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
  })
}

async function seedGated(db: DataProvider) {
  await withRemult(
    async () => {
      await repo(GatedTask).insert([
        { id: 1, title: 'public', pub: true, secret: 's1' },
        { id: 2, title: 'private', pub: false, secret: 's2' },
      ])
    },
    { dataProvider: db },
  )
}

describe('withRemult from', () => {
  useRealAsyncStorage()

  it('copies user, context and apiClient into a new remult', async () => {
    const dbA = new InMemoryDataProvider()
    const dbB = new InMemoryDataProvider()
    await withRemult(
      async (parent) => {
        parent.user = { id: 'u1', roles: ['admin'] }
        ;(parent.context as any).tenant = 't1'
        parent.apiClient.url = '/parent-api'

        await withRemult(
          async (r) => {
            expect(r).not.toBe(parent)
            expect(remult.user).toEqual({ id: 'u1', roles: ['admin'] })
            expect(remult.isAllowed('admin')).toBe(true)
            expect((remult.context as any).tenant).toBe('t1')
            expect(remult.apiClient.url).toBe('/parent-api')
            expect(remult.dataProvider).toBe(dbB)
          },
          { from: remult, dataProvider: dbB },
        )

        expect(remult.dataProvider).toBe(dbA)
      },
      { dataProvider: dbA },
    )
  })

  it('does not share the apiClient object with the parent', async () => {
    await withRemult(async (parent) => {
      parent.apiClient.url = '/parent-api'
      await withRemult(
        async (r) => {
          r.apiClient.url = '/child-api'
        },
        { from: parent },
      )
      expect(parent.apiClient.url).toBe('/parent-api')
    })
  })
})

describe('withFetch with async storage', () => {
  useRealAsyncStorage()

  it('reads through the fetch, keeps the user, leaves the request remult untouched', async () => {
    const dbA = new InMemoryDataProvider()
    const { calls, http } = mockHttp([{ id: 7, title: 'from api' }])
    await withRemult(
      async () => {
        remult.user = { id: 'u1' }
        const rows = await withFetch(http, async (r) => {
          expect(r.user?.id).toBe('u1')
          expect(remult.user?.id).toBe('u1')
          expect(remult.apiClient.httpClient).toBe(http)
          return repo(Task).find()
        })
        expect(rows.map((r) => r.id)).toEqual([7])
        expect(calls).toEqual(['/api/withFetchTasks'])
        expect(remult.dataProvider).toBe(dbA)
        expect(remult.apiClient.httpClient).toBeUndefined()
      },
      { dataProvider: dbA },
    )
  })

  it('url option overrides the api root', async () => {
    const { calls, http } = mockHttp()
    await withRemult(async () => {
      await withFetch(http, (r) => r.repo(Task).find(), { url: '/custom' })
      expect(calls).toEqual(['/custom/withFetchTasks'])
    })
  })

  it('a nested withFetch inherits the outer api root', async () => {
    const outer = mockHttp()
    const inner = mockHttp()
    await withRemult(async () => {
      await withFetch(
        outer.http,
        () => withFetch(inner.http, (r) => r.repo(Task).find()),
        { url: '/custom' },
      )
      expect(outer.calls).toEqual([])
      expect(inner.calls).toEqual(['/custom/withFetchTasks'])
    })
  })

  it('applies the api rules of the endpoint', async () => {
    const db = new InMemoryDataProvider()
    await seedGated(db)
    const http = apiHttpClient(db)
    await withRemult(
      async () => {
        await withFetch(http, async () => {
          const rows = await repo(GatedTask).find()
          expect(rows.map((r) => r.id)).toEqual([1]) // apiPrefilter
          expect(rows[0].secret).toBeFalsy() // includeInApi: false
          await expect(repo(GatedTask).delete(1)).rejects.toMatchObject({
            httpStatusCode: 403, // allowApiDelete: false
          })
        })
        expect(await repo(GatedTask).count()).toBe(2) // privileged again outside
      },
      { dataProvider: db },
    )
  })

  it('dispatches a static BackendMethod like a client call', async () => {
    const db = new InMemoryDataProvider()
    await seedGated(db)
    const http = apiHttpClient(db)
    await withRemult(
      async () => {
        expect(await GatedMethods.forbiddenCount()).toBe(2) // direct server call, no gate
        await expect(
          withFetch(http, () => GatedMethods.forbiddenCount()),
        ).rejects.toMatchObject({ httpStatusCode: 403 }) // allowed enforced at the endpoint
        expect(await withFetch(http, () => GatedMethods.totalCount())).toBe(2) // body runs privileged there
      },
      { dataProvider: db },
    )
  })

  it('dispatches an instance BackendMethod like a client call', async () => {
    const db = new InMemoryDataProvider()
    const http = apiHttpClient(db)
    await withRemult(
      async () => {
        const c = new GatedController()
        c.note = 'hi'
        expect(await c.echo()).toBe('hi!') // direct server call
        await expect(
          withFetch(http, () => c.forbiddenNote()),
        ).rejects.toMatchObject({ httpStatusCode: 403 })
        expect(await withFetch(http, () => c.echo())).toBe('hi!')
      },
      { dataProvider: db },
    )
  })

  it('concurrent loads each keep their own fetch', async () => {
    const a = mockHttp()
    const b = mockHttp()
    let open!: () => void
    const gate = new Promise<void>((r) => (open = r))
    await withRemult(async () => {
      const loadA = withFetch(a.http, async (r) => {
        await gate
        expect(remult.apiClient.httpClient).toBe(a.http)
        return r.repo(Task).find()
      })
      const loadB = withFetch(b.http, (r) => r.repo(Task).find())
      await loadB
      open()
      await loadA
      expect(a.calls).toEqual(['/api/withFetchTasks'])
      expect(b.calls).toEqual(['/api/withFetchTasks'])
    })
  })

  it('a BackendMethod outside a request cycle still runs in process', async () => {
    expect(await GatedMethods.ping()).toBe('pong')
  })

  it('works outside a request cycle', async () => {
    const { calls, http } = mockHttp()
    await withFetch(http, async (r) => {
      expect(r.user).toBeUndefined()
      await r.repo(Task).find()
    })
    expect(calls).toEqual(['/api/withFetchTasks'])
  })
})

describe('withFetch without async storage', () => {
  let runningOnServer: boolean
  beforeEach(() => {
    runningOnServer = remultStatic.actionInfo.runningOnServer
    remultStatic.actionInfo.runningOnServer = false
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined!)
  })
  afterEach(() => {
    remultStatic.actionInfo.runningOnServer = runningOnServer
    remult.user = undefined
  })

  it('reads through the callback remult, global remult untouched', async () => {
    const { calls, http } = mockHttp([{ id: 3, title: 'x' }])
    const rows = await withFetch(http, (r) => r.repo(Task).find())
    expect(rows.map((r) => r.id)).toEqual([3])
    expect(calls).toEqual(['/api/withFetchTasks'])
    expect(remult.apiClient.httpClient).toBeUndefined()
  })

  it('copies the user of the default remult', async () => {
    remult.user = { id: 'c1' }
    const { http } = mockHttp()
    await withFetch(http, async (r) => {
      expect(r.user?.id).toBe('c1')
    })
  })
})
