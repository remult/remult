import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { Entity, Fields, remult, repo } from '../core/index.js'
import { withFetch, RemultAsyncLocalStorage } from '../core/src/context.js'
import { remultStatic } from '../core/src/remult-static.js'
import { AsyncLocalStorageBridgeToRemultAsyncLocalStorageCore } from '../core/server/initAsyncHooks.js'

@Entity('tasks', { allowApiCrud: true })
class Task {
  @Fields.integer()
  id = 0
}

// a fetch that just records who was called, like event.fetch of a load
function makeFetch(tag: string, calls: string[]) {
  return (async (url: string) => {
    calls.push(tag)
    return new Response('[]')
  }) as typeof fetch
}

const tick = () => new Promise((r) => setTimeout(r, 10))

describe('the trap: +layout.ts and +page.ts in the BROWSER (no async storage)', () => {
  // SvelteKit runs both universal loads in parallel
  async function runBothLoads(calls: string[]) {
    const layoutLoad = withFetch(makeFetch('layout', calls), async () => {
      await tick() // ...layout is a bit slower to query
      await repo(Task).find()
      await tick()
    })
    const pageLoad = withFetch(makeFetch('page', calls), async () => {
      await repo(Task).find()
      await tick()
      await tick() // ...page finishes last
    })
    await Promise.all([layoutLoad, pageLoad])
  }

  it('trap 1: the layout query goes through the PAGE fetch', async () => {
    const calls: string[] = []
    await runBothLoads(calls)
    // what I wanted: each load uses its own event.fetch
    expect(calls).toEqual(['page', 'layout']) // FAILS: got ['page', 'page']
  })

  it('trap 2: after the loads, the global remult is stuck on a dead event.fetch', async () => {
    const calls: string[] = []
    await runBothLoads(calls)
    calls.length = 0
    // later, a button click doing a plain repo() call...
    await repo(Task).find()
    // ...should use the app's normal fetch, not a dead load's event.fetch
    expect(calls).toEqual([]) // FAILS: got ['layout'] - stuck forever
  })
})

describe('same code on the SERVER (async storage exists) - works fine', () => {
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

  it('each load uses its own fetch', async () => {
    await remultStatic.asyncContext.run(remultStatic.defaultRemult, async () => {
      const calls: string[] = []
      await Promise.all([
        withFetch(makeFetch('layout', calls), async () => {
          await tick()
          await repo(Task).find()
        }),
        withFetch(makeFetch('page', calls), async () => {
          await repo(Task).find()
          await tick()
          await tick()
        }),
      ])
      expect(calls).toEqual(['page', 'layout']) // PASSES
    })
  })
})
