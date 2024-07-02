import { writable } from 'svelte/store'

const browser = typeof window !== 'undefined'

type TLSContext = {
  currentLocationHash: string
  schema: Record<string, { x: number; y: number }>
}

const LSContextKey = 'LSRemultAdmin_2024_06_26_02'

const LSContextDefaults: TLSContext = {
  currentLocationHash: '/',
  schema: {},
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
