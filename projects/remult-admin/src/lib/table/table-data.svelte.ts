import type { EntityFilter, EntityOrderBy } from '../../../../core/index.js'
import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import { god, type TableInfo } from '../core/god.svelte.js'
import { RowDraft } from './row-draft.svelte.js'

type Values = Record<string, any>
type Verdict = { update: boolean; delete: boolean }

export type TableRow = { id: string; item: any; draft: RowDraft<Values> }

export type LoadRequest = {
  where: EntityFilter<any>
  orderBy?: EntityOrderBy<any>
  page: number
  limit: number
  live: boolean
}

export type TableDataDeps = {
  captions: (field: FieldUIInfo, rows: Values[]) => Promise<Record<string, Map<unknown, unknown>>>
  rowPermissions: (superKey: string, ids: string[]) => Promise<Record<string, Verdict>>
}

const defaultDeps: TableDataDeps = {
  captions: (field, rows) => god.displayValueForEach(field, rows),
  rowPermissions: (superKey, ids) => god.rowPermissions(superKey, ids),
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String(err.message)
  return typeof err === 'string' ? err : JSON.stringify(err)
}

/** One entity's rows: find or live query, count, relation captions and per row permissions. */
export class TableData {
  rows: TableRow[] = $state.raw([])
  total: number | undefined = $state()
  /** False until the first result for the current entity. */
  loaded = $state(false)
  loading = $state(false)
  error: string | undefined = $state()
  captions: Record<string, Map<unknown, unknown>> = $state.raw({})
  verdicts: Record<string, Verdict> = $state.raw({})

  #table: TableInfo
  #deps: TableDataDeps
  #drafts = new Map<string, RowDraft<Values>>()
  // every load bumps it: results of an older load (or a disposed table) are dropped
  #gen = 0
  #unsub: (() => void) | undefined
  #request: LoadRequest | undefined

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
    this.verdicts = {}
    const { repo } = this.#table
    const options = {
      where: request.where,
      orderBy: request.orderBy,
      limit: request.limit,
      page: request.page,
    }
    if (request.live) {
      this.#unsub = repo.liveQuery(options).subscribe({
        next: (info) => this.#apply(gen, info.items),
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
  }

  can(kind: 'update' | 'delete', id: string) {
    const p = this.#table.permissions[kind]
    // 'row' stays closed until the server has answered for this row
    return p === 'row' ? this.verdicts[id]?.[kind] === true : p
  }

  /** True once the per row answer is known (always true when the entity flag is not 'row'). */
  resolved(id: string) {
    const { update, delete: del } = this.#table.permissions
    return (update !== 'row' && del !== 'row') || id in this.verdicts
  }

  async delete(row: TableRow) {
    await this.#table.repo.delete(row.item)
    this.refresh()
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

  #apply(gen: number, items: any[]) {
    if (gen !== this.#gen) return
    const { repo, fields } = this.#table
    const keys = repo.metadata.fields.toArray().map((f) => f.key)
    const drafts = new Map<string, RowDraft<Values>>()
    const rows = items.map((item) => {
      const id = String(repo.metadata.idMetadata.getId(item))
      const values = Object.fromEntries(keys.map((k) => [k, item[k]]))
      let draft = this.#drafts.get(id)
      if (draft) draft.rebase(values)
      else draft = new RowDraft(values, fields)
      drafts.set(id, draft)
      return { id, item, draft }
    })
    this.#drafts = drafts
    this.rows = rows
    this.error = undefined
    this.loading = false
    this.loaded = true
    const values = rows.map((r) => r.draft.values)
    void this.#count(gen)
    void this.#loadCaptions(gen, values)
    void this.#loadVerdicts(gen, rows.map((r) => r.id))
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
    const results = await Promise.allSettled(relations.map((f) => this.#deps.captions(f, values)))
    if (gen !== this.#gen) return
    const next = { ...this.captions }
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      // merge, so captions of rows still on screen don't flash back to raw ids
      for (const [k, map] of Object.entries(r.value)) next[k] = new Map([...(next[k] ?? []), ...map])
    }
    this.captions = next
  }

  async #loadVerdicts(gen: number, ids: string[]) {
    const { update, delete: del } = this.#table.permissions
    if ((update !== 'row' && del !== 'row') || !ids.length) return
    try {
      const verdicts = await this.#deps.rowPermissions(this.#table.superKey, ids)
      if (gen !== this.#gen) return
      // ids the server did not report stay read-only
      this.verdicts = Object.fromEntries(
        ids.map((id) => [id, verdicts[id] ?? { update: false, delete: false }]),
      )
    } catch {
      // without an answer the rows stay read-only, the server enforces anyway
    }
  }
}
