import { writable } from 'svelte/store'

const browser = typeof window !== 'undefined'

type TLSContext = {
  currentLocationHash: string
}

const LSContextKey = 'LSRemultAdmin_2024_06_26'

const LSContextDefaults: TLSContext = {
  currentLocationHash: '/',
}

const LSCurrentContext = browser
  ? JSON.parse(localStorage.getItem(LSContextKey)!) || LSContextDefaults
  : LSContextDefaults

/**
 * Local storage context store
 */
export const LSContext = writable<TLSContext>(LSCurrentContext)

LSContext.subscribe((value) => {
  if (browser) {
    if (!value) {
      localStorage.setItem(LSContextKey, JSON.stringify(LSContextDefaults))
    } else {
      localStorage.setItem(LSContextKey, JSON.stringify(value))
    }
  }
})
