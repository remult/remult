import { get, writable } from 'svelte/store'
import { God } from '../God'
import { LSContext } from '../lib/stores/LSContext.js'
import { getHeader } from '../lib/helper.js'
import { SSContext } from '../lib/stores/SSContext.js'

function createStore() {
  const { subscribe, set } = writable<God>()

  const reloadEntities = () => {
    const LSCtx = get(LSContext)
    const SSCtx = get(SSContext)

    const apiUrl = LSCtx.settings.apiUrl

    fetch(`${apiUrl}/me?entities-metadata`, {
      headers: getHeader(SSCtx, LSCtx),
    })
      .then((res) => res.json())
      .then((json) => {
        set(new God(json))
      })
  }

  reloadEntities()

  return {
    subscribe,

    reloadEntities,
  }
}

export const godStore = createStore()
