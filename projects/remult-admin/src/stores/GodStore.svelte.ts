import { writable } from 'svelte/store'
import { God } from '../God'
import { DisplayOptions, EntityUIInfo } from '../../../core/server/remult-admin'

declare const entities: EntityUIInfo[]

// function createStore() {
//   const { subscribe, set } = writable<God>()

//   if (import.meta.env.DEV) {
//     fetch('/api/dev-admin')
//       .then((res) => res.json())
//       .then((json) => {
//         set(new God(json))
//       })
//   } else {
//     set(new God(entities))
//   }

//   return {
//     subscribe,
//   }
// }

// export const godStore = createStore()

export class GodStore {
  internalGod: God = $state()

  constructor() {
    if (import.meta.env.DEV) {
      fetch('/api/dev-admin')
        .then((res) => res.json())
        .then((json) => {
          this.internalGod = new God(json)
        })
    } else {
      this.internalGod = new God(entities)
    }
  }
  // async getItemsForSelect(
  //   relation: DisplayOptions['relation'],
  //   search: string | undefined,
  // ) {
  //   return this.god.getItemsForSelect(relation, search)
  // }
  // async displayValueFor(relation: DisplayOptions['relation'], value: any) {
  //   return this.god.displayValueFor(relation, value)
  // }
}
