import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'RemultAdmin_2026_11'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
  }
}

const throwingStorage = new Proxy({} as Storage, {
  get() {
    throw new Error('SecurityError')
  },
})

// persistence effects run on svelte's scheduler; one macrotask lets them flush
const nextTask = () => new Promise((r) => setTimeout(r))

async function load() {
  return await import('./settings.svelte.js')
}

describe('settings', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults when nothing stored', async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    const { settings, session } = await load()
    expect(settings.numberOfRows).toBe(25)
    expect(settings.displayCaption).toBe(true)
    expect(settings.theme).toBe('system')
    expect(settings.lastLocation).toBe('/')
    expect(session).toEqual({ bearerAuth: '', forbiddenEntities: [] })
  })

  it('corrupt JSON in storage -> defaults', async () => {
    vi.stubGlobal('localStorage', memoryStorage({ [KEY]: '{not json' }))
    vi.stubGlobal('sessionStorage', memoryStorage({ [KEY]: 'null' }))
    const { settings, session } = await load()
    expect(settings.numberOfRows).toBe(25)
    expect(session.bearerAuth).toBe('')
  })

  it('storage throwing -> defaults, no crash', async () => {
    vi.stubGlobal('localStorage', throwingStorage)
    vi.stubGlobal('sessionStorage', throwingStorage)
    const { settings, session } = await load()
    expect(settings.numberOfRows).toBe(25)
    expect(session.forbiddenEntities).toEqual([])
    settings.numberOfRows = 50
    await nextTask()
    expect(settings.numberOfRows).toBe(50)
  })

  it('reads stored values over defaults', async () => {
    vi.stubGlobal(
      'localStorage',
      memoryStorage({ [KEY]: JSON.stringify({ numberOfRows: 100 }) }),
    )
    vi.stubGlobal('sessionStorage', memoryStorage())
    const { settings } = await load()
    expect(settings.numberOfRows).toBe(100)
    expect(settings.confirmDelete).toBe(true)
  })

  it('persists changes', async () => {
    const ls = memoryStorage()
    const ss = memoryStorage()
    vi.stubGlobal('localStorage', ls)
    vi.stubGlobal('sessionStorage', ss)
    const { settings, session } = await load()
    settings.numberOfRows = 50
    session.bearerAuth = 'tok'
    await nextTask()
    expect(JSON.parse(ls.getItem(KEY)!).numberOfRows).toBe(50)
    expect(JSON.parse(ss.getItem(KEY)!).bearerAuth).toBe('tok')
  })

  it('resetSettings restores defaults', async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    const { settings, resetSettings } = await load()
    settings.numberOfRows = 50
    settings.editMode = { tasks: 'drawer' }
    resetSettings()
    expect(settings.numberOfRows).toBe(25)
    expect(settings.editMode).toEqual({})
  })
})
