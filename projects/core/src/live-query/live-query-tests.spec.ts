import { queryConfig, Remult } from '../context'
import { DataApi, DataApiRequest } from '../data-api'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import {
  Entity,
  Fields,
  FindOptions,
  getEntityRef,
  RepositoryImplementation,
} from '../remult3'
import { actionInfo } from '../server-action'
import { createMockHttpDataProvider } from '../tests/testHelper'
import { SubscriptionChannel, LiveQueryChange } from './SubscriptionChannel'
import { LiveQueryClient } from './LiveQueryClient'
import {
  LiveQueryPublisher,
  LiveQueryStorage,
  InMemoryLiveQueryStorage,
} from './SubscriptionServer'
import {
  findOptionsFromJson,
  findOptionsToJson,
} from '../data-providers/rest-data-provider'
import { remult } from '../remult-proxy'
import { HttpProviderBridgeToRestDataProviderHttpProvider } from '../buildRestDataProvider'
import { describe, it, expect,beforeEach,afterEach } from 'vitest'

const joc = expect.objectContaining

@Entity('event-test', { allowApiCrud: true })
export class eventTestEntity {
  @Fields.integer()
  id = 0
  @Fields.string()
  title: string
  @Fields.string((o, remult) => (o.serverExpression = () => remult.user.name))
  selectUser = ''
  @Fields.date()
  birthDate = new Date(1976, 5, 16)
}

async function setup1() {
  const mem = new InMemoryDataProvider()
  const serverRemult = new Remult(mem)
  serverRemult.user = { id: 'server', name: 'server', roles: [] }
  const serverRepo = serverRemult.repo(eventTestEntity)
  const items = [
    { id: 1, title: 'noam' },
    { id: 2, title: 'yael' },
    { id: 3, title: 'yoni' },
    { id: 4, title: 'maayan' },
    { id: 5, title: 'itamar' },
    { id: 6, title: 'ofri' },
  ]
  await serverRepo.insert(items)
  const remult = new Remult(mem)
  remult.user = { id: clientId1, name: clientId1, roles: [] }
  const clientRepo = remult.repo(eventTestEntity)
  const messages: LiveQueryChange[] = []
  serverRemult.subscriptionServer = {
    publishMessage: async (c, m: any) => {
      messages.push(...m)
    },
  }
  serverRemult.liveQueryStorage = new InMemoryLiveQueryStorage()
  const qm = new LiveQueryPublisher(
    () => serverRemult.subscriptionServer,
    () => serverRemult.liveQueryStorage,
    async (_, _1, c) => c(clientRepo),
  )
  let p = new PromiseResolver(qm)

  serverRemult.liveQueryPublisher = qm
  await serverRemult.liveQueryStorage.add({
    entityKey: clientRepo.metadata.key,
    data: {
      findOptionsJson: {},
      requestJson: {},
      lastIds: items.map((x) => x.id),
    },
    id: 'xxx',
  })
  expect(messages.length).toBe(0)
  return { serverRepo, messages, flush: () => p.flush() }
}

const clientId1 = 'clientId1'
describe('Live Query', () => {
  beforeEach(() => {
    actionInfo.runningOnServer = true
  })
  afterEach(() => {
    actionInfo.runningOnServer = false
  })
  it('test that data is sent with correct remult user', async () => {
    const { serverRepo, messages, flush } = await setup1()
    const row = await serverRepo.findId(1)
    row.title += '1'
    await serverRepo.save(row)
    await flush()
    expect(messages).toEqual([
      joc({
        type: 'replace',
        data: joc({
          oldId: 1,
          item: joc({ selectUser: clientId1 }),
        }),
      }),
    ])
  })
  it('test that id change is supported', async () => {
    const { serverRepo, messages, flush } = await setup1()
    const row = await serverRepo.findId(1)
    row.id = 99
    await serverRepo.save(row)
    await flush()
    expect(messages).toEqual([
      joc({
        type: 'replace',
        data: joc({
          oldId: 1,
          item: joc({
            id: 99,
            selectUser: clientId1,
          }),
        }),
      }),
    ])
  })
  it('new row is reported', async () => {
    const { serverRepo, messages, flush } = await setup1()
    const row = await serverRepo.insert([{ id: 9, title: 'david' }])
    await flush()
    expect(messages).toEqual([
      joc({
        type: 'add',
        data: joc({
          item: joc({
            id: 9,
            selectUser: clientId1,
          }),
        }),
      }),
    ])
  })
  it('removed row is reported', async () => {
    const { serverRepo, messages, flush } = await setup1()
    await serverRepo.delete(await serverRepo.findFirst({ id: 1 }))
    await flush()
    expect(messages).toEqual([
      joc({
        type: 'remove',
        data: { id: 1 },
      }),
    ])
  })
})

function createTestPromise() {
  let resume: VoidFunction
  const r = new Promise((r) => {
    resume = () => r({})
  })
  return Object.assign(r, { resume })
}

class PromiseResolver {
  private promises: any[] = []
  constructor(...who: { runPromise: (p: any) => void }[]) {
    for (const w of who) {
      w.runPromise = (p) => {
        this.promises.push(p)
        return p
      }
    }
  }
  async flush() {
    while (this.promises.length > 0) {
      let p = this.promises
      this.promises = []

      await Promise.all(p).catch((err) => {})
    }
  }
}

describe('Live Query Client', () => {
  it('registers once', async () => {
    let open = 0
    let get = 0
    let sendMessage = (x) => {}
    const lqc = new LiveQueryClient(
      () => ({
        subscriptionClient: {
          async openConnection(onMessage) {
            open++
            return {
              close() {
                open--
              },
              async subscribe(channel, onMessage) {
                sendMessage = (x) => onMessage([x])
                return () => {}
              },
            }
          },
        },
        httpClient: {
          get: async (url) => {
            get++
            return [
              {
                id: 1,
                title: 'noam',
              },
            ]
          },
          put: () => undefined,
          post: async () => {},
          delete: () => undefined,
        },
      }),
      () => serverRemult.user?.id,
    )
    let p = new PromiseResolver(lqc)
    const serverRemult = new Remult(new InMemoryDataProvider())
    serverRemult.liveQuerySubscriber = lqc
    const serverRepo = serverRemult.repo(eventTestEntity)
    let closeSub1: VoidFunction
    let closeSub2: VoidFunction
    let result1: eventTestEntity[]
    let result2: eventTestEntity[]
    closeSub1 = serverRepo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => {
        result1 = reducer(result1)
      })
    closeSub2 = serverRepo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => {
        result2 = reducer(result2)
      })
    await p.flush()
    expect(open).toBe(1)
    expect(get).toBe(1)
    expect(result1[0].title).toBe('noam')
    expect(result2[0].title).toBe('noam')
    sendMessage({
      type: 'replace',
      data: {
        oldId: 1,
        item: {
          id: 1,
          title: 'noam1',
        },
      },
    } as LiveQueryChange)
    await p.flush()
    expect(result1[0].title).toBe('noam1')
    expect(result2[0].title).toBe('noam1')
    closeSub1()
    await p.flush()
    sendMessage({
      type: 'replace',
      data: {
        oldId: 1,
        item: {
          id: 1,
          title: 'noam2',
        },
      },
    } as LiveQueryChange)
    await p.flush()
    expect(result1[0].title).toBe('noam1')
    expect(result2[0].title).toBe('noam2')
    closeSub2()
    await p.flush()
    expect(open).toBe(0)
    get = 0
    closeSub1 = lqc.subscribe(
      serverRepo as any,
      {},
      {
        complete: () => {},
        error: () => {},
        next: ({ applyChanges: reducer }) => {
          result1 = reducer(result1) as any
        },
      },
    )
    await p.flush()
    expect(open).toBe(1)
    expect(get).toBe(1)
    closeSub1()
    await p.flush()
    expect(open).toBe(0)
  })
})

describe('test live query full cycle', () => {
  beforeEach(() => {
    queryConfig.defaultPageSize = 100
  })
  afterEach(() => {
    queryConfig.defaultPageSize = 2
  })
  function setup2() {
    const mem = new InMemoryDataProvider()
    const remult = new Remult(mem)
    const repo = remult.repo(eventTestEntity)
    const remult2 = new Remult(mem)
    const repo2 = remult2.repo(eventTestEntity)

    const mh: ((channel: string, message: LiveQueryChange) => void)[] = []
    let messageCount = 0
    remult.liveQueryStorage = new InMemoryLiveQueryStorage()
    remult.subscriptionServer = {
      async publishMessage<liveQueryMessage>(channel, message) {
        mh.forEach((x) => x(channel, message))
      },
    }

    const qm = new LiveQueryPublisher(
      () => remult.subscriptionServer,
      () => remult.liveQueryStorage,
      async (_, _1, c) => c(repo),
    )
    remult.liveQueryPublisher = qm
    var dataApi = new DataApi(repo, remult)
    const clientStatus = {
      connected: true,
      reconnect: () => {},
    }
    let unsubscribeCount = 0

    const buildLqc = () => {
      return new LiveQueryClient(
        () => ({
          subscriptionClient: {
            async openConnection(onReconnect) {
              clientStatus.connected = true
              clientStatus.reconnect = () => {
                onReconnect()
                clientStatus.connected = true
              }
              const channels: string[] = []

              return {
                close() {},
                async subscribe(channel, onMessage) {
                  channels.push(channel)
                  mh.push((c, message) => {
                    if (clientStatus.connected)
                      if (channels.includes(c) && c == channel) {
                        messageCount++
                        onMessage(message)
                      }
                  })

                  return () => {
                    unsubscribeCount++
                    channels.splice(channels.indexOf(channel), 1)
                  }
                },
              }
            },
          },
          httpClient: createMockHttpDataProvider(dataApi),
        }),
        () => remult.user?.id,
      )
    }
    const lqc1 = buildLqc()
    const lqc2 = buildLqc()

    var pm = new PromiseResolver(lqc1, lqc2, qm)
    remult.liveQuerySubscriber = lqc1
    remult2.liveQuerySubscriber = lqc2
    remult.liveQueryPublisher = qm
    remult2.liveQueryPublisher = qm
    return {
      repo,
      pm,
      repo2,
      messageCount: () => messageCount,
      clientStatus,
      qm: remult.liveQueryStorage as InMemoryLiveQueryStorage,
      testApi: () => createMockHttpDataProvider(dataApi),
      remult,
      unsubscribeCount() {
        return unsubscribeCount
      },
    }
  }
  it('integration test 1', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    const u = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    expect(result1.length).toBe(0)
    await repo.insert({ id: 1, title: 'noam' })
    await repo2.insert({ id: 2, title: 'yael' })
    await pm.flush()
    expect(result1.length).toBe(2)
    result1[0] = { ...result1[0], title: 'noam1' }
    await repo2.save({ ...result1[1], title: 'yael2' })
    await pm.flush()
    expect(result1.length).toBe(2)
    expect(result1[0].title).toBe('noam1')
    expect(result1[0].birthDate.getFullYear()).toBe(1976)
    expect(result1[1].title).toBe('yael2')
    await repo.save(result1[0])
    u()
  })
  it('integration test 2', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    await repo.insert({ id: 1, title: 'noam' })
    const u = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    expect(result1[0].title).toBe('noam')
    expect(result1[0].birthDate.getFullYear()).toBe(1976)
    u()
  })
  it('test delete works', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    const u = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await repo2.insert({ id: 2, title: 'yael' })
    await pm.flush()
    await repo.delete(result1[1])
    await pm.flush()
    expect(result1.length).toBe(1)
    u()
  })
  it('test sort works', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    let items: eventTestEntity[] = []
    const u = repo
      .liveQuery({
        orderBy: { title: 'desc' },
      })
      .subscribe((info) => {
        result1 = info.applyChanges(result1)
        items = info.items
      })
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    await repo2.insert({ id: 2, title: 'yael' })
    await pm.flush()
    expect(result1.map((r) => r.id)).toEqual([1, 2])
    expect(items.map((r) => r.id)).toEqual([2, 1])
    u()
  })
  it('test add works if item already in array', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    const u = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    result1 = [await repo.insert({ id: 1, title: 'noam' })]
    await pm.flush()
    expect(result1.length).toBe(1)
    u()
  })
  it('test add works if item already in array', async () => {
    var { repo, pm, repo2 } = setup2()
    let result1: eventTestEntity[] = []
    const u = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    expect(result1.length).toBe(1)
    u()
  })

  it('test quick unsubscribe before subscribe completes', async () => {
    const serverRemult = new Remult(new InMemoryDataProvider())
    const serverRepo = serverRemult.repo(eventTestEntity)
    var dataApi = new DataApi(serverRepo, serverRemult)
    var remult = new Remult()
    var dp = createMockHttpDataProvider(dataApi)
    let waitForUnsubscribe = createTestPromise()
    let waitForSubscribe = createTestPromise()
    let stats = {
      sub: 0,
      unSub: 0,
      query: 0,
    }
    remult.apiClient.httpClient = {
      post: (a, b) => dp.post(a, b),
      put: (a, b) => dp.put(a, b),
      delete: (a) => dp.delete(a),
      get: async (url) => {
        stats.query++

        return dp.get(url)
      },
    }
    let mh: ((channel: string, message: any) => void)[] = []
    serverRemult.subscriptionServer = {
      publishMessage: async (c, m) => mh.forEach((x) => x(c, m)),
    }
    serverRemult.liveQueryStorage = new InMemoryLiveQueryStorage()
    serverRemult.liveQueryPublisher = new LiveQueryPublisher(
      () => serverRemult.subscriptionServer,
      () => serverRemult.liveQueryStorage,
      async (_, _1, c) => c(serverRemult.repo(eventTestEntity)),
    )

    remult.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe: async (a, handler) => {
            waitForUnsubscribe.resume()
            await waitForSubscribe
            stats.sub++
            mh.push((c, m) => {
              handler(m)
            })
            return () => {
              stats.unSub++
              mh = mh.filter((h) => h !== handler)
            }
          },
          close: () => {},
        }
      },
    }
    var pm = new PromiseResolver(
      remult.liveQuerySubscriber,
      serverRemult.liveQueryPublisher as LiveQueryPublisher,
    )
    const repo = remult.repo(eventTestEntity)
    let result1: eventTestEntity[] = []
    let u = repo.liveQuery().subscribe({
      next: ({ applyChanges: reducer }) => (result1 = reducer(result1)),
      error: (err) => {
        throw err
      },
    })
    await waitForUnsubscribe
    u()
    waitForSubscribe.resume()
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    expect(result1.length).toBe(0)
    expect(stats.sub).toBe(1)
    expect(stats.unSub).toBe(1)
    expect(stats.query).toBe(0)
  })
  it('test quick unsubscribe before query completes', async () => {
    const serverRemult = new Remult(new InMemoryDataProvider())
    const serverRepo = serverRemult.repo(eventTestEntity)
    var dataApi = new DataApi(serverRepo, serverRemult)
    var remult = new Remult()
    var dp = createMockHttpDataProvider(dataApi)
    let waitForUnsubscribe = createTestPromise()
    let waitForGet = createTestPromise()

    remult.apiClient.httpClient = {
      post: (a, b) => dp.post(a, b),
      put: (a, b) => dp.put(a, b),
      delete: (a) => dp.delete(a),
      get: async (url) => {
        waitForUnsubscribe.resume()
        await waitForGet
        return dp.get(url)
      },
    }
    let mh: ((channel: string, message: any) => void)[] = []
    serverRemult.subscriptionServer = {
      publishMessage: async (c, m) => mh.forEach((x) => x(c, m)),
    }
    serverRemult.liveQueryStorage = new InMemoryLiveQueryStorage()
    serverRemult.liveQueryPublisher = new LiveQueryPublisher(
      () => serverRemult.subscriptionServer,
      () => serverRemult.liveQueryStorage,
      async (_, _1, c) => c(serverRemult.repo(eventTestEntity)),
    )
    let stats = {
      sub: 0,
      unSub: 0,
    }
    remult.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe: async (a, handler) => {
            stats.sub++
            mh.push((c, m) => {
              handler(m)
            })
            return () => {
              stats.unSub++
              mh = mh.filter((h) => h !== handler)
            }
          },
          close: () => {},
        }
      },
    }
    var pm = new PromiseResolver(
      remult.liveQuerySubscriber,
      serverRemult.liveQueryPublisher as LiveQueryPublisher,
    )
    const repo = remult.repo(eventTestEntity)
    let result1: eventTestEntity[] = []
    let u = repo.liveQuery().subscribe({
      next: ({ applyChanges: reducer }) => (result1 = reducer(result1)),
      error: (err) => {
        throw err
      },
    })
    await waitForUnsubscribe
    u()
    waitForGet.resume()
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    expect(result1.length).toBe(0)
    expect(stats.sub).toBe(1)
    expect(stats.unSub).toBe(1)
  })
  it('test quick unsubscribe and subscribe', async () => {
    const serverRemult = new Remult(new InMemoryDataProvider())
    const serverRepo = serverRemult.repo(eventTestEntity)
    var dataApi = new DataApi(serverRepo, serverRemult)
    var remult = new Remult()
    var dp = createMockHttpDataProvider(dataApi)
    let stats = {
      sub: 0,
      unSub: 0,
      get: 0,
      post: 0,
    }
    remult.apiClient.httpClient = {
      post: (a, b) => {
        stats.post++
        return dp.post(a, b)
      },
      put: (a, b) => dp.put(a, b),
      delete: (a) => dp.delete(a),
      get: async (url) => {
        stats.get++

        return dp.get(url)
      },
    }
    let mh: ((channel: string, message: any) => void)[] = []
    serverRemult.subscriptionServer = {
      publishMessage: async (c, m) => mh.forEach((x) => x(c, m)),
    }
    serverRemult.liveQueryStorage = new InMemoryLiveQueryStorage()
    serverRemult.liveQueryPublisher = new LiveQueryPublisher(
      () => serverRemult.subscriptionServer,
      () => serverRemult.liveQueryStorage,
      async (_, _1, c) => c(serverRemult.repo(eventTestEntity)),
    )

    remult.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe: async (a, handler) => {
            stats.sub++
            mh.push((c, m) => {
              handler(m)
            })
            return () => {
              stats.unSub++
              mh = mh.filter((h) => h !== handler)
            }
          },
          close: () => {},
        }
      },
    }
    var pm = new PromiseResolver(
      remult.liveQuerySubscriber,
      serverRemult.liveQueryPublisher as LiveQueryPublisher,
    )
    const repo = remult.repo(eventTestEntity)
    let result1: eventTestEntity[] = []
    let u = repo.liveQuery().subscribe({
      next: ({ applyChanges: reducer }) => (result1 = reducer(result1)),
      error: (err) => {
        throw err
      },
    })
    await pm.flush()
    u()
    u = repo.liveQuery().subscribe({
      next: ({ applyChanges: reducer }) => (result1 = reducer(result1)),
      error: (err) => {
        throw err
      },
    })
    await pm.flush()
    expect(result1.length).toBe(0)
    expect(stats.sub).toBe(2)
    expect(stats.unSub).toBe(1)
    expect(stats.get).toBe(2)
    u()
  })

  it('test unsubscribe works', async () => {
    var { repo, pm, messageCount, qm, unsubscribeCount, remult } = setup2()
    let result1: eventTestEntity[] = []
    const unsubscribe = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    expect(result1.length).toBe(1)
    expect(messageCount()).toBe(1)
    expect(qm.queries.length).toBe(1)

    unsubscribe()
    await pm.flush()
    await repo.insert({ id: 2, title: 'noam' })
    await pm.flush()
    expect(qm.queries.length).toBe(0)
    expect(messageCount()).toBe(1)
    expect(unsubscribeCount()).toBe(1)
    expect(
      (remult.liveQueryStorage as InMemoryLiveQueryStorage)
        .removeCountForTesting,
    ).toBe(1)
    unsubscribe()
    await pm.flush()
    expect(unsubscribeCount()).toBe(1)
    expect(
      (remult.liveQueryStorage as InMemoryLiveQueryStorage)
        .removeCountForTesting,
    ).toBe(1)
  })
  it('test unsubscribe works after  subscribe and unsubscribe', async () => {
    var { repo, pm, messageCount, qm, unsubscribeCount, remult } = setup2()
    let result1: eventTestEntity[] = []
    let unsubscribe = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    unsubscribe()
    await pm.flush()
    unsubscribe = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    unsubscribe()
    await pm.flush()
    expect(unsubscribeCount()).toBe(2)
    expect(
      (remult.liveQueryStorage as InMemoryLiveQueryStorage)
        .removeCountForTesting,
    ).toBe(2)
  })
  it('test unsubscribe works after a quick subscribe and unsubscribe', async () => {
    var { repo, pm, messageCount, qm, unsubscribeCount, remult } = setup2()
    let result1: eventTestEntity[] = []
    let unsubscribe = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    unsubscribe()
    await pm.flush()
    unsubscribe = repo
      .liveQuery()
      .subscribe(({ applyChanges: reducer }) => (result1 = reducer(result1)))
    await pm.flush()
    unsubscribe()
    await pm.flush()
    expect(unsubscribeCount()).toBe(1)
    expect(
      (remult.liveQueryStorage as InMemoryLiveQueryStorage)
        .removeCountForTesting,
    ).toBe(1)
  })
  it('test disconnect and reconnect scenario', async () => {
    var { repo, pm, clientStatus } = setup2()
    let result1: eventTestEntity[] = []
    const u = repo
      .liveQuery()
      .subscribe((reducer) => (result1 = reducer.applyChanges(result1)))
    await pm.flush()
    await repo.insert({ id: 1, title: 'noam' })
    await pm.flush()
    expect(result1.length).toBe(1)
    clientStatus.connected = false
    await repo.insert({ id: 2, title: 'yael' })
    await pm.flush()
    expect(result1.length).toBe(1)
    clientStatus.reconnect()
    expect(clientStatus.connected).toBe(true)
    await pm.flush()
    expect(result1.length).toBe(2)
    u()
  })
  it('expect pure json object, from live query', async () => {
    var { testApi, repo } = setup2()
    await repo.insert({ title: 'a' })
    const r = await testApi().get('/api/tasks?__action=liveQuery|123')
    expect(getEntityRef(r[0], false)).toBe(undefined)
  })
  it('test 2 subscriptions work', async () => {
    var { repo, pm } = setup2()
    await repo.insert({ title: 'a' })
    await repo.insert({ title: 'b' })
    let arr1 = []
    let arr2 = []
    const u1 = repo.liveQuery().subscribe((y) => (arr1 = y.applyChanges(arr1)))
    await pm.flush()
    const u2 = repo.liveQuery().subscribe((y) => {
      arr2 = y.applyChanges(arr2)
      expect(y.items.length).toBe(2)
    })
    await pm.flush()
    expect(arr1.length).toBe(arr2.length)
    u1()
    u2()
  })
  it('test subscription leak', async () => {
    var { repo, pm } = setup2()
    await repo.insert({ title: 'a1', id: 1 })
    await repo.insert({ title: 'a2', id: 2 })
    await repo.insert({ title: 'b1', id: 3 })
    await repo.insert({ title: 'b2', id: 4 })

    let arr1: eventTestEntity[]
    let arr2 = []
    let arr1Items: eventTestEntity[][] = []
    let arr1Messages: LiveQueryChange[][] = []
    let arr2Messages: LiveQueryChange[][] = []
    const u1 = repo
      .liveQuery({ where: { title: { $contains: 'a' } } })
      .subscribe((y) => {
        arr1 = y.applyChanges(arr1)
        arr1Items.push([...y.items])
        arr1Messages.push(y.changes)
      })
    await pm.flush()
    let done = false
    const u2 = repo
      .liveQuery({ where: { title: { $contains: 'b' } } })
      .subscribe({
        next: (y) => {
          arr2 = y.applyChanges(arr2)
          arr2Messages.push(y.changes)
        },
        complete: () => (done = true),
      })
    await pm.flush()
    await repo.insert({ title: 'a3', id: 5 })
    await pm.flush()
    expect(arr1.length).toBe(3)
    expect(arr2.length).toBe(2)
    expect(arr1Items.length).toBe(2)
    expect(arr1Messages.length).toBe(2)
    expect(arr2Messages.length).toBe(1)
    expect(arr1Items[0].length).toBe(2)
    expect(arr1Items[1].length).toBe(3)
    expect(arr1Messages[0].length).toBe(1)
    expect(arr1Messages[1][0].type).toBe('add')
    u1()
    expect(done).toBe(false)
    u2()
    await pm.flush()
    expect(done).toBe(true)
  })
  it('error on channel open', async () => {
    let { remult } = await setup2()
    remult.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe(channel, onMessage) {
            throw 'the error'
          },
          close() {},
        }
      },
    }
    remult.liveQuerySubscriber = new LiveQueryClient(
      () => remult.apiClient,
      () => remult.user?.id,
    )
    let pm = new PromiseResolver(remult.liveQuerySubscriber)
    let error = false
    let u = remult
      .repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        error: (er) => {
          error = true
        },
      })
    await pm.flush()
    expect(error).toBe(true)
    u()
  })
  it('error on channel open', async () => {
    let { remult } = await setup2()
    remult.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          async subscribe(channel, onMessage, onError) {
            onError('had error')
            return () => {}
          },
          close() {},
        }
      },
    }
    remult.liveQuerySubscriber = new LiveQueryClient(
      () => remult.apiClient,
      () => remult.user?.id,
    )
    let pm = new PromiseResolver(remult.liveQuerySubscriber)
    let error = false
    let u = remult
      .repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        error: (er) => {
          error = true
        },
      })
    await pm.flush()
    expect(error).toBe(true)
    u()
  })
})
it('Serialize Find Options', async () => {
  const r = new Remult().repo(eventTestEntity)
  const findOptions: FindOptions<eventTestEntity> = {
    limit: 3,
    page: 2,
    where: {
      $and: [
        {
          title: 'noam',
        },
      ],
    },
    orderBy: {
      title: 'desc',
    },
  }

  const z = findOptionsToJson(findOptions, r.metadata)
  const res = findOptionsFromJson(z, r.metadata)
  expect(res).toEqual(findOptions)
})
it('Serialize Find Options1', async () => {
  const r = new Remult().repo(eventTestEntity)
  const findOptions: FindOptions<eventTestEntity> = {
    where: {
      $and: [
        {
          title: 'noam',
        },
      ],
    },
    orderBy: {
      title: 'desc',
    },
  }

  const z = findOptionsToJson(findOptions, r.metadata)
  const res = findOptionsFromJson(JSON.parse(JSON.stringify(z)), r.metadata)
  expect(res).toEqual(findOptions)
})
it('Serialize Find Options2', async () => {
  const r = new Remult().repo(eventTestEntity)
  const findOptions: FindOptions<eventTestEntity> = {
    where: {
      $and: [
        {
          title: 'noam',
        },
      ],
    },
    orderBy: {
      title: 'desc',
    },
    load: (x) => [x.title, x.birthDate],
  }

  const z = findOptionsToJson(findOptions, r.metadata)
  const res: FindOptions<eventTestEntity> = findOptionsFromJson(
    JSON.parse(JSON.stringify(z)),
    r.metadata,
  )
  expect(res.load(r.fields).map((f) => f.key)).toEqual(['title', 'birthDate'])
})

it('test channel subscribe', async () => {
  const mc = new SubscriptionChannel('zxcvz')
  let sub = 0
  let close = 0
  remult.apiClient.subscriptionClient = {
    openConnection: async () => {
      return {
        subscribe: async (what) => {
          sub++
          return () => {
            sub--
          }
        },
        close() {
          close++
        },
      }
    },
  }
  let pr = new PromiseResolver(remult.liveQuerySubscriber)
  let r = await mc.subscribe(() => {})
  let r2 = await mc.subscribe(() => {})
  await pr.flush()
  expect(sub).toBe(1)
  r()
  await pr.flush()
  expect(sub).toBe(1)
  r2()
  await pr.flush()
  expect(sub).toBe(0)
  r()
  r2()
  await pr.flush()
  expect(sub).toBe(0)
  expect(close).toBe(1)
})

describe('test failure', () => {
  it('error on subscribe query', async () => {  
    let r = new Remult(new InMemoryDataProvider())
    r.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe(channel, onMessage) {
            throw 'the error'
          },
          close() {},
        }
      },
    }
    let pm = new PromiseResolver(r.liveQuerySubscriber)
    let error = false
    let u = r
      .repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        error: (er) => {
          error = true
        },
      })
    await pm.flush()
    expect(error).toBe(true)
    u()
  })
  it('test error on query, automatically unsubscribes', async () => {
    const error = () => {
      throw Error('error')
    }
    var cr = new Remult(
      new HttpProviderBridgeToRestDataProviderHttpProvider({
        delete: error,
        get: error,
        post: error,
        put: error,
      }),
    )
    let subCount = 0
    let unSubCount = 0
    cr.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          async subscribe(channel, onMessage) {
            subCount++
            return () => {
              unSubCount++
            }
          },
          close() {},
        }
      },
    }
    let pm = new PromiseResolver(cr.liveQuerySubscriber)
    let errorHappened = false
    cr.repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        next: (x) => {},
        error: () => (errorHappened = true),
      })
    await pm.flush()
    expect(errorHappened).toBe(true)
    expect(subCount).toBe(1)
    expect(cr.liveQuerySubscriber.hasQueriesForTesting()).toBe(false)
    expect(unSubCount).toBe(1)
  })
  it('error on subscribe', async () => {
    let r = new Remult(new InMemoryDataProvider())
    r.liveQueryStorage = new InMemoryLiveQueryStorage()
    await r.repo(eventTestEntity).insert({ id: 1, title: 'a' })
    expect(await r.repo(eventTestEntity).count()).toBe(1)
    let items: any[]
    let error = false

    var cr = new Remult(
      createMockHttpDataProvider(new DataApi(r.repo(eventTestEntity), r)),
    )
    cr.apiClient.subscriptionClient = {
      openConnection: async () => {
        return {
          subscribe(channel, onMessage) {
            throw 'the error'
          },
          close() {},
        }
      },
    }
    let pm = new PromiseResolver(cr.liveQuerySubscriber)
    expect(await cr.repo(eventTestEntity).count()).toBe(1)
    let u = cr
      .repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        error: (er) => {
          error = true
        },
        next: (x) => (items = x.items),
      })
    await pm.flush()
    expect(error).toBe(true)
    expect(items).toBeUndefined()
    u()
  })
  it('Error on open connection', async () => {
    let r = new Remult(new InMemoryDataProvider())
    r.liveQueryStorage = new InMemoryLiveQueryStorage()
    await r.repo(eventTestEntity).insert({ id: 1, title: 'a' })
    expect(await r.repo(eventTestEntity).count()).toBe(1)
    let items: any[]
    let error = false

    var cr = new Remult(
      createMockHttpDataProvider(new DataApi(r.repo(eventTestEntity), r)),
    )
    cr.apiClient.subscriptionClient = {
      openConnection: async () => {
        throw 'open connection error'
      },
    }
    let pm = new PromiseResolver(cr.liveQuerySubscriber)
    expect(await cr.repo(eventTestEntity).count()).toBe(1)
    let u = cr
      .repo(eventTestEntity)
      .liveQuery()
      .subscribe({
        error: (er) => {
          error = true
        },
        next: (x) => (items = x.items),
      })
    await pm.flush()
    expect(error).toBe(true)
    expect(items).toBeUndefined()
    u()
    await pm.flush()
  })
})
