import type { EntityFilter, EntityOrderBy } from '../../../../core/index.js'
import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import { god, type TableInfo } from '../core/god.svelte.js'
import { valueKey } from './format.js'
import { RowDraft } from './row-draft.svelte.js'

type Values = Record<string, any>

/** `item` is the server entity; undefined on a row not inserted yet. */
export type TableRow = {
  id: string
  item: any
  draft: RowDraft<Values>
  isNew?: boolean
}

/** `busy`: that row is already saving, nothing was sent. */
export type SaveResult =
  | { ok: true }
  | { ok: false; message?: string; busy?: true }

/** What a row just went through; `keys`: the cells a cancel put back. */
export type RowFlash = { kind: 'saved' | 'reverted'; keys?: string[] }

/** Ms an outcome stays shown. */
export const FLASH_MS = 1400

export type LoadRequest = {
  where: EntityFilter<any>
  orderBy?: EntityOrderBy<any>
  page: number
  limit: number
  live: boolean
}

export type TableDataDeps = {
  captions: (
    field: FieldUIInfo,
    rows: Values[],
  ) => Promise<Record<string, Map<unknown, unknown>>>
  /** Next reads skip the client's dedupe cache. */
  freshReads: () => void
}

const defaultDeps: TableDataDeps = {
  captions: (field, rows) => god.displayValueForEach(field, rows),
  freshReads: () => god.freshReads(),
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err)
    return String(err.message)
  return typeof err === 'string' ? err : JSON.stringify(err)
}

/** Validation messages keyed by the edited key (valFieldKey for relations); undefined when none maps to a field. */
export function fieldErrors(
  err: unknown,
  fields: FieldUIInfo[],
): Record<string, string> | undefined {
  const ms =
    err && typeof err === 'object' && 'modelState' in err
      ? err.modelState
      : undefined
  if (!ms || typeof ms !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const f of fields) {
    const m =
      (ms as Record<string, unknown>)[f.valFieldKey] ??
      (ms as Record<string, unknown>)[f.key]
    if (m) out[valueKey(f)] = String(m)
  }
  return Object.keys(out).length ? out : undefined
}

/** Plain `key: value` pairs of a parent filter, to start a new child row from. */
export function prefillFrom(where: EntityFilter<any> | undefined): Values {
  if (!where || typeof where !== 'object') return {}
  return Object.fromEntries(
    Object.entries(where).filter(
      ([k, v]) =>
        !k.startsWith('$') &&
        ['string', 'number', 'boolean'].includes(typeof v),
    ),
  )
}

/** One entity's rows: find or live query, count, relation captions, per row permissions and saves. */
export class TableData {
  rows: TableRow[] = $state.raw([])
  total: number | undefined = $state()
  /** False until the first result for the current entity. */
  loaded = $state(false)
  loading = $state(false)
  error: string | undefined = $state()
  captions: Record<string, Map<unknown, unknown>> = $state.raw({})
  /** Rows typed in but not inserted yet, shown above the page. */
  newRows: TableRow[] = $state.raw([])
  /** Per row id, per edited key: the server's validation message. */
  errors: Record<string, Record<string, string>> = $state({})
  saving: Record<string, boolean> = $state({})
  /** Per row id: the outcome of its last save or cancel, for FLASH_MS. */
  flash: Record<string, RowFlash> = $state({})

  #table: TableInfo
  #deps: TableDataDeps
  #drafts = new Map<string, RowDraft<Values>>()
  // every load bumps it: results of an older load (or a disposed table) are dropped
  #gen = 0
  #newSeq = 0
  #unsub: (() => void) | undefined
  #request: LoadRequest | undefined
  #flashTimers = new Map<string, ReturnType<typeof setTimeout>>()
  // an inserted row flashes once a load shows it; forgotten if none does soon
  #flashOnShow = new Map<string, ReturnType<typeof setTimeout>>()
  #disposed = false

  constructor(table: TableInfo, deps: Partial<TableDataDeps> = {}) {
    this.#table = table
    this.#deps = { ...defaultDeps, ...deps }
  }

  get live() {
    return !!this.#request?.live
  }

  load(request: LoadRequest) {
    this.#stop()
    const gen = ++this.#gen
    this.#request = request
    this.loading = true
    const { repo } = this.#table
    const options = {
      where: request.where,
      orderBy: request.orderBy,
      limit: request.limit,
      page: request.page,
    }
    if (request.live) {
      this.#unsub = repo.liveQuery(options).subscribe({
        next: (info) => this.#apply(gen, info.items, true),
        error: (err) => this.#fail(gen, err),
      })
    } else {
      repo.find(options).then(
        (items) => this.#apply(gen, items),
        (err) => this.#fail(gen, err),
      )
    }
  }

  /** Live queries refresh themselves; a plain find needs a nudge after a write. */
  refresh() {
    if (this.#request && !this.#request.live) this.load(this.#request)
  }

  dispose() {
    this.#stop()
    this.#gen++
    this.#disposed = true
    for (const t of this.#flashTimers.values()) clearTimeout(t)
    for (const t of this.#flashOnShow.values()) clearTimeout(t)
    this.#flashTimers.clear()
    this.#flashOnShow.clear()
    this.flash = {}
  }

  can(kind: 'update' | 'delete') {
    // a function rule is decided by the server on save
    return this.#table.permissions[kind] !== false
  }

  /** Rows not inserted yet, then edited rows. */
  dirtyRows(): TableRow[] {
    return [...this.newRows, ...this.rows.filter((r) => r.draft.dirty)]
  }

  find(id: string): TableRow | undefined {
    return (
      this.newRows.find((r) => r.id === id) ??
      this.rows.find((r) => r.id === id)
    )
  }

  addNew(prefill: Values = {}): TableRow {
    const row = this.draftNew(prefill)
    this.newRows = [row, ...this.newRows]
    return row
  }

  /** A new row kept off the table (the drawer's create form); `save` inserts it like any new row. */
  draftNew(prefill: Values = {}): TableRow {
    const values = Object.fromEntries(this.#keys().map((k) => [k, prefill[k]]))
    const draft = new RowDraft(values, this.#table.fields)
    return { id: `new:${++this.#newSeq}`, item: undefined, draft, isNew: true }
  }

  cancel(row: TableRow) {
    delete this.errors[row.id]
    if (row.isNew) {
      this.newRows = this.newRows.filter((r) => r !== row)
      return
    }
    const keys = Object.keys(row.draft.changes())
    row.draft.reset()
    if (keys.length) this.#flash(row.id, { kind: 'reverted', keys })
  }

  clearError(row: TableRow, key: string) {
    if (this.errors[row.id]?.[key]) delete this.errors[row.id][key]
  }

  /** Update sends only the changed keys; insert sends every value typed in. */
  async save(row: TableRow): Promise<SaveResult> {
    const { repo, fields } = this.#table
    if (this.saving[row.id]) return { ok: false, busy: true }
    delete this.errors[row.id]
    this.saving[row.id] = true
    try {
      if (row.isNew) {
        const writable = new Set(
          fields.filter((f) => !f.readOnly).map(valueKey),
        )
        const values = Object.fromEntries(
          Object.entries($state.snapshot(row.draft.values)).filter(
            ([k, v]) => v !== undefined && writable.has(k),
          ),
        )
        const inserted = await repo.insert(values)
        this.newRows = this.newRows.filter((r) => r !== row)
        if (inserted)
          this.#flashWhenShown(String(repo.metadata.idMetadata.getId(inserted)))
        this.refresh()
      } else {
        const changes = row.draft.changes()
        if (!Object.keys(changes).length) return { ok: true }
        // by id, not the entity: a failed save must not leave edits on the row's item
        const saved = await repo.update(
          repo.metadata.idMetadata.getId(row.item),
          changes,
        )
        // editors are locked while saving, so dropping the user's values loses nothing
        row.draft.rebase(this.#valuesOf(saved))
        row.draft.reset()
        this.#flash(row.id, { kind: 'saved' })
      }
      return { ok: true }
    } catch (err) {
      const errors = fieldErrors(err, fields)
      if (errors) {
        this.errors[row.id] = errors
        return { ok: false }
      }
      return { ok: false, message: errorMessage(err) }
    } finally {
      delete this.saving[row.id]
    }
  }

  async delete(row: TableRow) {
    await this.#table.repo.delete(row.item)
    this.refresh()
  }

  #flash(id: string, flash: RowFlash) {
    if (this.#disposed) return
    clearTimeout(this.#flashTimers.get(id))
    this.flash[id] = flash
    this.#flashTimers.set(
      id,
      setTimeout(() => {
        this.#flashTimers.delete(id)
        delete this.flash[id]
      }, FLASH_MS),
    )
  }

  #flashWhenShown(id: string) {
    if (this.#disposed) return
    clearTimeout(this.#flashOnShow.get(id))
    this.#flashOnShow.set(
      id,
      setTimeout(() => this.#flashOnShow.delete(id), FLASH_MS * 3),
    )
  }

  #stop() {
    this.#unsub?.()
    this.#unsub = undefined
  }

  #fail(gen: number, err: unknown) {
    if (gen !== this.#gen) return
    this.error = errorMessage(err)
    this.loading = false
    this.loaded = true
  }

  #keys() {
    return this.#table.repo.metadata.fields.toArray().map((f) => f.key)
  }

  #valuesOf(item: any): Values {
    return Object.fromEntries(this.#keys().map((k) => [k, item[k]]))
  }

  #apply(gen: number, items: any[], live = false) {
    if (gen !== this.#gen) return
    const { repo, fields } = this.#table
    const drafts = new Map<string, RowDraft<Values>>()
    const rows = items.map((item) => {
      const id = String(repo.metadata.idMetadata.getId(item))
      const values = this.#valuesOf(item)
      let draft = this.#drafts.get(id)
      if (draft) draft.rebase(values)
      else draft = new RowDraft(values, fields)
      drafts.set(id, draft)
      return { id, item, draft }
    })
    this.#drafts = drafts
    this.rows = rows
    for (const r of rows) {
      const wait = this.#flashOnShow.get(r.id)
      if (wait === undefined) continue
      clearTimeout(wait)
      this.#flashOnShow.delete(r.id)
      this.#flash(r.id, { kind: 'saved' })
    }
    this.error = undefined
    this.loading = false
    this.loaded = true
    const values = rows.map((r) => r.draft.values)
    // a live tick means someone wrote: a deduped count would show the old total
    if (live) this.#deps.freshReads()
    void this.#count(gen)
    void this.#loadCaptions(gen, values)
  }

  async #count(gen: number) {
    try {
      const total = await this.#table.repo.count(this.#request!.where)
      if (gen === this.#gen) this.total = total
    } catch {
      // the rows are what matter; the pager shows no total
      if (gen === this.#gen) this.total = undefined
    }
  }

  async #loadCaptions(gen: number, values: Values[]) {
    const relations = this.#table.fields.filter((f) => f.relationToOne)
    if (!relations.length || !values.length) return
    const results = await Promise.allSettled(
      relations.map((f) => this.#deps.captions(f, values)),
    )
    if (gen !== this.#gen) return
    const next = { ...this.captions }
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      // merge, so captions of rows still on screen don't flash back to raw ids
      for (const [k, map] of Object.entries(r.value))
        next[k] = new Map([...(next[k] ?? []), ...map])
    }
    this.captions = next
  }
}
