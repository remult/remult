import { writable } from 'svelte/store'
import { LSSS_ContextKey } from './LSContext.js'
import { isBrowser } from '@melt-ui/svelte/internal/helpers'

export type TSSContext = {
  settings: {
    bearerAuth: string
  }
  forbiddenEntities: string[]
}

const SSContextDefaults: TSSContext = {
  settings: {
    bearerAuth: '',
  },
  forbiddenEntities: [],
}

const SSCurrentContext = isBrowser
  ? JSON.parse(sessionStorage.getItem(LSSS_ContextKey)!) || SSContextDefaults
  : SSContextDefaults

/**
 * Local storage context store
 */
const store = () => {
  const { set, subscribe, update } = writable<TSSContext>(SSCurrentContext)

  return {
    set,
    subscribe,
    update,
    reset: () => {
      set(SSContextDefaults)
      window.location.reload()
    },
  }
}

export const SSContext = store()

SSContext.subscribe((value) => {
  if (isBrowser) {
    if (!value) {
      sessionStorage.setItem(LSSS_ContextKey, JSON.stringify(SSContextDefaults))
    } else {
      sessionStorage.setItem(LSSS_ContextKey, JSON.stringify(value))
    }
  }
})
