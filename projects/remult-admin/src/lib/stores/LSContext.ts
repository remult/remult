import { writable } from 'svelte/store'

const browser = typeof window !== 'undefined'

export type TLSContext = {
  currentLocationHash: string
  schema: Record<string, { x: number; y: number }>
  settings: {
    search: string
    dispayCaption: boolean
    numberOfRows: number
    confirmDelete: boolean
    diagramLayoutAlgorithm: 'grid-bfs' | 'grid-dfs' | 'line'
    keyForBearerAuth: string
    // apiUrl: string
    disableLiveQuery: boolean | undefined
    customHeaders: string
  }
}

export const LSSS_ContextKey = 'RemultAdmin_2025_05_07'

const LSContextDefaults: TLSContext = {
  currentLocationHash: '/',
  schema: {},
  settings: {
    search: '',
    dispayCaption: true,
    confirmDelete: true,
    numberOfRows: 25,
    diagramLayoutAlgorithm: 'grid-dfs',
    keyForBearerAuth: '',
    // apiUrl: window.optionsFromServer?.rootPath ?? '/api',
    disableLiveQuery: undefined,
    customHeaders: '',
  },
}

const LSCurrentContext = browser
  ? JSON.parse(localStorage.getItem(LSSS_ContextKey)!) || LSContextDefaults
  : LSContextDefaults

/**
 * Local storage context store
 */
const store = () => {
  const { set, subscribe, update } = writable<TLSContext>(LSCurrentContext)

  return {
    set,
    subscribe,
    update,
    reset: () => {
      set(LSContextDefaults)
      window.location.reload()
    },
  }
}

export const LSContext = store()

LSContext.subscribe((value) => {
  if (browser) {
    if (!value) {
      localStorage.setItem(LSSS_ContextKey, JSON.stringify(LSContextDefaults))
    } else {
      localStorage.setItem(LSSS_ContextKey, JSON.stringify(value))
    }
  }
})
