import { writable } from 'svelte/store'
import { God } from '../God'
import { EntityUIInfo } from '../../../core/server/remult-admin'

declare const entities: EntityUIInfo[]

function createStore() {
  const { subscribe, set } = writable<God>()

  if (import.meta.env.DEV) {
    fetch('/api/dev-admin')
      .then((res) => res.json())
      .then((json) => {
        set(new God(json))
      })
  } else {
    set(new God(entities))
  }

  return {
    subscribe,
  }
}

export const godStore = createStore()
