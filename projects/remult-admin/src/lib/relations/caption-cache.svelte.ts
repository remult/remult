import { SvelteMap } from 'svelte/reactivity'
import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import { god } from '../core/god.svelte.js'
import { targetKeyOf } from '../core/relation-captions.js'

type Load = (field: FieldUIInfo, ids: unknown[]) => Promise<Map<unknown, unknown>>

/** Relation captions outside a table page (a filter chip, a value just picked); lookups batch per relation. */
export class CaptionCache {
  #known = new SvelteMap<string, unknown>()
  #asked = new Set<string>()
  #queue = new Map<string, { field: FieldUIInfo; ids: Set<unknown> }>()
  #timer: ReturnType<typeof setTimeout> | undefined
  #load: Load

  constructor(load: Load) {
    this.#load = load
  }

  // two fields pointing at the same target key share their captions
  #group(f: FieldUIInfo) {
    const rel = f.relationToOne!
    return `${rel.entityKey}|${targetKeyOf(rel, f.valFieldKey)}`
  }

  #key(f: FieldUIInfo, id: unknown) {
    return `${this.#group(f)}|${typeof id}:${String(id)}`
  }

  get(f: FieldUIInfo, id: unknown): unknown {
    return this.#known.get(this.#key(f, id))
  }

  set(f: FieldUIInfo, id: unknown, caption: unknown) {
    if (caption === undefined || caption === null || caption === '') return
    this.#known.set(this.#key(f, id), caption)
  }

  /** Looks the caption up once, unless it's known or already asked for. */
  request(f: FieldUIInfo, id: unknown) {
    if (id === undefined || id === null || id === '') return
    const key = this.#key(f, id)
    if (this.#known.has(key) || this.#asked.has(key)) return
    this.#asked.add(key)
    const g = this.#group(f)
    const entry = this.#queue.get(g) ?? { field: f, ids: new Set() }
    entry.ids.add(id)
    this.#queue.set(g, entry)
    this.#timer ??= setTimeout(() => this.#flush(), 0)
  }

  #flush() {
    this.#timer = undefined
    const batch = [...this.#queue.values()]
    this.#queue.clear()
    for (const { field, ids } of batch) {
      this.#load(field, [...ids]).then(
        (map) => {
          for (const [id, caption] of map) this.set(field, id, caption)
        },
        // a failed lookup leaves the raw id on screen; asking again would fail the same way
        () => {},
      )
    }
  }
}

export const captions = new CaptionCache((field, ids) => god.captionsFor(field, ids))
