import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  withRemult,
  remult,
  repo,
  type DataProvider,
} from '../core/index.js'
import { TestApiDataProvider } from '../core/server/test-api-data-provider.js'
import { RemultAsyncLocalStorage } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'

let userSeenByApiPipeline: string | undefined

@Entity('tasks', {
  allowApiCrud: true,
  apiPrefilter: () => {
    userSeenByApiPipeline = remult.user?.id
    return undefined
  },
})
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => (resolve = res))
  return { promise, resolve }
}

// `find` signals when it starts and blocks until released - holds the in-process call open.
function gatedDataProvider(
  inner: DataProvider,
  started: () => void,
  gate: Promise<void>,
): DataProvider {
  return {
    getEntityDataProvider: (entity) => {
      const rows = inner.getEntityDataProvider(entity)
      return {
        ...rows,
        count: rows.count.bind(rows),
        groupBy: rows.groupBy?.bind(rows),
        find: async (options) => {
          started()
          await gate
          return rows.find(options)
        },
        update: rows.update.bind(rows),
        delete: rows.delete.bind(rows),
        insert: rows.insert.bind(rows),
      }
    },
    transaction: (action) => inner.transaction(action),
  }
}

// A withRemult starting while TestApiDataProvider swaps the process-global statics
// registers in the throwaway context and loses its remult once they are restored.
describe('TestApiDataProvider with concurrent server requests', () => {
  beforeEach(() => {
    remultStatic.asyncContext = new RemultAsyncLocalStorage(
      new AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore(),
    )
    RemultAsyncLocalStorage.enable()
  })
  afterEach(() => {
    RemultAsyncLocalStorage.disable()
    remultStatic.asyncContext = new RemultAsyncLocalStorage(undefined)
  })

  it("a concurrent withRemult keeps its own context and user", async () => {
    const aCallStarted = deferred()
    const releaseA = deferred()
    const bEntered = deferred()
    const aFinished = deferred()

    const testApi = TestApiDataProvider({
      ensureSchema: false,
      dataProvider: gatedDataProvider(
        new InMemoryDataProvider(),
        aCallStarted.resolve,
        releaseA.promise,
      ),
    })

    // Request A: a server load reading through the api pipeline in-process.
    const requestA = withRemult(
      async () => {
        remult.user = { id: 'A' }
        await repo(Task).find()
      },
      { dataProvider: testApi },
    ).then(aFinished.resolve)

    // Request B: enters withRemult while A's in-process api call is in flight.
    const requestB = (async () => {
      await aCallStarted.promise
      return withRemult(async () => {
        const userSeenOnEntry = remult.user?.id
        remult.user = { id: 'B' }
        bEntered.resolve()
        await aFinished.promise // A completes, statics restored
        return { userSeenOnEntry, userAfterA: remult.user?.id }
      })
    })()

    await bEntered.promise
    releaseA.resolve()
    await requestA

    const b = await requestB
    expect(userSeenByApiPipeline).toBe('A') // caller's user reaches the api pipeline
    expect(b.userSeenOnEntry).toBeUndefined() // leaked 'A' = cross-request user bleed
    expect(b.userAfterA).toBe('B') // throws 'outside of a valid request cycle' today
  })
})
