import { writable } from 'svelte/store'

const browser = typeof window !== 'undefined'

export type TLSContext = {
  currentLocationHash: string
  schema: Record<string, { x: number; y: number }>
  settings: {
    search: string
    dispayCaption: boolean
    confirmDelete: boolean
    diagramLayoutAlgorithm: 'grid-bfs' | 'grid-dfs' | 'line'
    keyForBearerAuth: string
    apiUrl: string
  }
}

const LSContextKey = 'LSRemultAdmin_2024_08_29'

const LSContextDefaults: TLSContext = {
  currentLocationHash: '/',
  schema: {},
  settings: {
    search: '',
    dispayCaption: true,
    confirmDelete: true,
    diagramLayoutAlgorithm: 'grid-dfs',
    keyForBearerAuth: '',
    apiUrl: '/api',
  },
}

const LSCurrentContext = browser
  ? JSON.parse(localStorage.getItem(LSContextKey)!) || LSContextDefaults
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
      localStorage.setItem(LSContextKey, JSON.stringify(LSContextDefaults))
    } else {
      localStorage.setItem(LSContextKey, JSON.stringify(value))
    }
  }
})
