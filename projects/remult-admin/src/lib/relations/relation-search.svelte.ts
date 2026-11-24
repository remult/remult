import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import { god } from '../core/god.svelte.js'
import { errorMessage } from '../table/table-data.svelte.js'
import { captions } from './caption-cache.svelte.js'

export type RelationItem = { id: unknown; caption: unknown }
type Load = (
  field: FieldUIInfo,
  search: string | undefined,
) => Promise<{ items: RelationItem[]; $count: number }>

/** Search a relation's targets by caption: debounced, and only the latest answer lands. */
export class RelationSearch {
  items: RelationItem[] = $state.raw([])
  /** Targets matching the query; more than `items` when the list is cut. */
  count: number | undefined = $state()
  loading = $state(false)
  error: string | undefined = $state()

  #field: FieldUIInfo
  #load: Load
  #seq = 0
  #timer: ReturnType<typeof setTimeout> | undefined

  constructor(
    field: FieldUIInfo,
    load: Load = (f, q) => god.getItemsForSelect(f, q),
  ) {
    this.#field = field
    this.#load = load
  }

  search(query: string, delay = 160) {
    clearTimeout(this.#timer)
    const q = query.trim()
    this.loading = true
    this.#timer = setTimeout(() => this.#run(q), q ? delay : 0)
  }

  dispose() {
    clearTimeout(this.#timer)
    this.#seq++
  }

  async #run(q: string) {
    const seq = ++this.#seq
    try {
      const r = await this.#load(this.#field, q || undefined)
      if (seq !== this.#seq) return
      for (const it of r.items) captions.set(this.#field, it.id, it.caption)
      this.items = r.items
      this.count = r.$count
      this.error = undefined
    } catch (err) {
      if (seq === this.#seq) this.error = errorMessage(err)
    } finally {
      if (seq === this.#seq) this.loading = false
    }
  }
}
