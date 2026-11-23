import type { FieldUIInfo } from '../../../../core/server/remult-admin'

// relation edits bind to valFieldKey, so that is the key to track
const keyOf = (f: FieldUIInfo) => (f.relationToOne ? f.valFieldKey : f.key)

const isEmpty = (v: unknown) => v === undefined || v === null

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    return Object.fromEntries(
      Object.keys(v)
        .sort()
        .map((k) => [k, canonical((v as any)[k])]),
    )
  }
  return v
}

function same(a: unknown, b: unknown): boolean {
  // undefined (omitted by the API) and null both mean "no value"
  if (isEmpty(a) || isEmpty(b)) return isEmpty(a) && isEmpty(b)
  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
  }
  return a === b
}

const clone = <T>(v: T): T => (v === undefined ? v : ($state.snapshot(v) as T))

export class RowDraft<T extends Record<string, any>> {
  values: T = $state() as T
  #baseline: T = $state.raw() as T
  #keys: string[] = []
  // field.key and valFieldKey both resolve to the tracked key
  #tracked = new Map<string, string>()
  #dirty = $derived(this.#keys.some((k) => this.isDirty(k)))

  constructor(server: T, fields: FieldUIInfo[]) {
    this.#keys = [...new Set(fields.map(keyOf))]
    for (const f of fields) {
      this.#tracked.set(f.key, keyOf(f))
      this.#tracked.set(keyOf(f), keyOf(f))
    }
    this.#baseline = clone(server)
    this.values = clone(server)
  }

  get dirty(): boolean {
    return this.#dirty
  }

  isDirty(fieldKey: string): boolean {
    const k = this.#tracked.get(fieldKey)
    return k !== undefined && !same(this.values[k], this.#baseline[k])
  }

  rebase(server: T): void {
    const next: Record<string, any> = { ...clone(server) }
    for (const k of this.#keys) {
      // an edited field keeps the user's value, everything else follows the server
      if (this.isDirty(k)) next[k] = $state.snapshot(this.values[k])
    }
    this.#baseline = clone(server)
    this.values = next as T
  }

  reset(): void {
    this.values = clone(this.#baseline)
  }

  changes(): Partial<T> {
    const out: Record<string, any> = {}
    for (const k of this.#keys)
      if (this.isDirty(k)) out[k] = $state.snapshot(this.values[k]) ?? null
    return out as Partial<T>
  }
}
