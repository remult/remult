import { remult } from '../../../../core/src/remult-proxy'
import type {
  AdminPermission,
  EntityUIInfo,
  FieldUIInfo,
} from '../../../../core/server/remult-admin'
import type {
  FindOptions,
  Repository,
} from '../../../../core/src/remult3/remult3'
import { Fields } from '../../../../core/src/remult3/Fields'
import { Entity } from '../../../../core/src/remult3/entity'
import { buildHeaders, createHttpClient, type HttpClient } from './http.js'
import {
  captionOf,
  relationCaptions,
  targetKeyOf,
} from './relation-captions.js'
import { session, settings } from './settings.svelte.js'

export type TableInfo = EntityUIInfo & { repo: Repository<any> }

// server cap per request (ADMIN_ROW_PERMISSIONS_MAX_IDS)
const ROW_PERMISSIONS_MAX_IDS = 200

function hues(count: number) {
  return Array.from({ length: count }, (_, i) => String((i * 360) / count))
}

// 'row' means it depends on the row: let the request through, the server decides
const allowed = (p: AdminPermission) => p !== false

export function buildTables(infos: EntityUIInfo[]): TableInfo[] {
  const colors = hues(infos.length)
  return [...infos]
    .sort((a, b) => a.caption.localeCompare(b.caption))
    .map((info, i) => {
      // JSON drops undefined and value lists may come as plain strings: restore what FieldUIInfo promises
      const fields = info.fields.map((f) => ({
        ...f,
        values: (f.values ?? []).map((v) =>
          typeof v === 'object' ? v : { id: v, caption: String(v) },
        ),
        inputType: f.inputType ?? '',
      }))
      class C {}
      for (const f of fields) {
        const proto = C.prototype as any
        // a string field would turn numeric value list ids into strings
        const type = typeof f.values[0]?.id === 'number' ? 'number' : f.type
        switch (type) {
          case 'json':
            Fields.json()(proto, f.key)
            break
          case 'number':
            Fields.number()(proto, f.key)
            break
          case 'boolean':
            Fields.boolean()(proto, f.key)
            break
          default:
            Fields.string()(proto, f.key)
            break
        }
      }
      Entity(info.key, {
        caption: info.caption,
        id: info.ids,
        allowApiInsert: allowed(info.permissions.insert),
        allowApiUpdate: allowed(info.permissions.update),
        allowApiDelete: allowed(info.permissions.delete),
      })(C)
      return { ...info, fields, color: colors[i], repo: remult.repo(C) }
    })
}

function apiUrl() {
  return window.optionsFromServer?.rootPath ?? '/api'
}

function readLocalStorage(k: string) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}

function headers(init?: HeadersInit) {
  return buildHeaders({ ...session, ...settings, readLocalStorage }, init)
}

export function hasToken() {
  return !!headers().authorization
}

class God {
  // raw: repos are class instances and infos are replaced wholesale on reload
  tables: TableInfo[] = $state.raw([])
  visibleTables: TableInfo[] = $derived(
    this.tables.filter((t) => t.hidden === false),
  )
  loaded = $state(false)
  loading = $state(false)
  error: string | undefined = $state()
  /** Set by any 401; the shell asks for a token. */
  unauthorized = $state(false)
  userName: string | undefined = $state()
  #http: HttpClient | undefined
  #onReload = new Set<() => void>()

  onReload(fn: () => void) {
    this.#onReload.add(fn)
  }

  /** The next reads skip the dedupe cache: the data changed on the server. */
  freshReads() {
    this.#http?.clear()
  }

  #setupApi() {
    remult.apiClient.url = apiUrl()
    remult.apiClient.httpClient = this.#http = createHttpClient({
      apiUrl: apiUrl(),
      getHeaders: () => headers(),
      onForbidden: (key) => {
        if (!session.forbiddenEntities.includes(key))
          session.forbiddenEntities.push(key)
      },
      onUnauthorized: () => (this.unauthorized = true),
    })
  }

  async reload() {
    this.error = undefined
    this.unauthorized = false
    this.loading = true
    // forbidden is per user: the new token gets a fresh verdict
    session.forbiddenEntities = []
    for (const fn of this.#onReload) fn()
    try {
      this.#setupApi()
      const user = await remult.initUser()
      this.userName = user?.name
      const res = await fetch(`${apiUrl()}/admin/__entities-metadata`, {
        headers: headers(),
      })
      if (res.status === 401) this.unauthorized = true
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim())
      this.tables = buildTables(await res.json())
    } catch (err) {
      this.tables = []
      this.error = this.unauthorized
        ? 'The server rejected this token.'
        : err instanceof Error
          ? err.message
          : String(err)
    } finally {
      this.loaded = true
      this.loading = false
    }
  }

  bySuperKey(k: string) {
    return this.tables.find((t) => t.superKey === k)
  }

  byKey(k: string) {
    return this.tables.find((t) => t.key === k)
  }

  /** Text keys a relation caption can fall back to, in the target's field order. */
  #captionKeys(t: TableInfo) {
    return t.fields
      .filter(
        (f) =>
          f.type === 'string' &&
          !t.ids[f.key] &&
          !f.relationToOne &&
          !f.values.length,
      )
      .map((f) => f.key)
  }

  /** First 11 targets by caption (one more than shown tells "there is more") and the total matching `search`. */
  async getItemsForSelect(field: FieldUIInfo, search: string | undefined) {
    const relation = field.relationToOne!
    const t = this.byKey(relation.entityKey)
    if (!t) return { items: [], $count: 0 }
    const where = search
      ? { [relation.captionField]: { $contains: search } }
      : undefined
    const key = targetKeyOf(relation, field.valFieldKey)!
    const fallback = this.#captionKeys(t)
    const [items, count] = await Promise.all([
      t.repo.find({
        limit: 11,
        orderBy: { [relation.captionField]: 'asc' },
        where,
      }),
      t.repo.count(where),
    ])
    return {
      items: items.map((x) => ({
        id: x[key],
        caption: captionOf(x, relation.captionField, fallback),
      })),
      $count: count,
    }
  }

  async displayValueFor(field: FieldUIInfo, value: any) {
    const rel = field.relationToOne!
    const t = this.byKey(rel.entityKey)
    if (!t) return 'Forbidden - ' + value
    const [item] = await t.repo.find({
      where: { [targetKeyOf(rel, field.valFieldKey)!]: value },
    })
    if (!item) return value !== undefined ? 'not found - ' + value : '-'
    return (
      captionOf(item, rel.captionField, this.#captionKeys(t)) ??
      `Can't display ${rel.captionField} - ${value}`
    )
  }

  async displayValueForEach(field: FieldUIInfo, values: any[]) {
    const rel = field.relationToOne!
    const k = field.valFieldKey
    const t = this.byKey(rel.entityKey)
    if (!t)
      return { [k]: new Map(values.map((x) => [x[k], `Forbidden (${x[k]})`])) }

    const present = values.filter(
      (x) => x[k] !== undefined && x[k] !== null && x[k] !== '',
    )
    if (!present.length) return { [k]: new Map() }
    const keys = Object.keys(rel.fields)
    const o: FindOptions<any> =
      keys.length === 1
        ? { where: { [keys[0]]: [...new Set(present.map((x) => x[k]))] } }
        : {
            where: {
              $or: present.map((x) => ({
                $and: Object.entries(rel.fields).map(([key, value]) => ({
                  [key]: x[value],
                })),
              })),
            },
          }

    const items = await t.repo.find({ ...o, limit: present.length })
    return { [k]: relationCaptions(rel, k, items, this.#captionKeys(t)) }
  }

  /** Captions of a few relation values, like the ids a filter chip holds. */
  async captionsFor(field: FieldUIInfo, ids: unknown[]) {
    const k = field.valFieldKey
    const res = await this.displayValueForEach(
      field,
      ids.map((id) => ({ [k]: id })),
    )
    return res[k]
  }

  /** Per row update/delete verdicts, for entities whose rules depend on the row. */
  async rowPermissions(superKey: string, ids: string[]) {
    const out: Record<string, { update: boolean; delete: boolean }> = {}
    for (let i = 0; i < ids.length; i += ROW_PERMISSIONS_MAX_IDS) {
      // the shared client: a 401 asks for a token, custom headers apply
      const res = await this.#http!(`${apiUrl()}/admin/__row-permissions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          superKey,
          ids: ids.slice(i, i + ROW_PERMISSIONS_MAX_IDS),
        }),
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim())
      Object.assign(out, await res.json())
    }
    return out
  }
}

export const god = new God()
