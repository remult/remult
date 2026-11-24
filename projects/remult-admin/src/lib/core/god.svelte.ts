import { remult } from '../../../../core/src/remult-proxy'
import type {
  AdminPermission,
  EntityUIInfo,
  FieldRelationToOneInfo,
  FieldUIInfo,
} from '../../../../core/server/remult-admin'
import type { FindOptions, Repository } from '../../../../core/src/remult3/remult3'
import { Fields } from '../../../../core/src/remult3/Fields'
import { Entity } from '../../../../core/src/remult3/entity'
import { buildHeaders, createHttpClient } from './http.js'
import { relationCaptions } from './relation-captions.js'
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
      class C {}
      for (const f of info.fields) {
        const proto = C.prototype as any
        switch (f.type) {
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
      // JSON drops undefined: restore what FieldUIInfo promises
      const fields = info.fields.map((f) => ({ ...f, values: f.values ?? [], inputType: f.inputType ?? '' }))
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
  visibleTables: TableInfo[] = $derived(this.tables.filter((t) => t.hidden === false))
  loaded = $state(false)
  loading = $state(false)
  error: string | undefined = $state()
  /** Set by any 401; the shell asks for a token. */
  unauthorized = $state(false)
  userName: string | undefined = $state()

  #setupApi() {
    remult.apiClient.url = apiUrl()
    remult.apiClient.httpClient = createHttpClient({
      apiUrl: apiUrl(),
      getHeaders: () => headers(),
      onForbidden: (key) => {
        if (!session.forbiddenEntities.includes(key)) session.forbiddenEntities.push(key)
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

  async getItemsForSelect(relation: FieldRelationToOneInfo, search: string | undefined) {
    const t = this.byKey(relation.entityKey)
    if (!t) return { items: [], $count: 0 }
    const where = search ? { [relation.captionField]: { $contains: search } } : undefined
    const [items, count] = await Promise.all([
      t.repo.find({ limit: 11, orderBy: { [relation.captionField]: 'asc' }, where }),
      t.repo.count(where),
    ])
    return {
      items: items.map((x) => ({
        // TODO: support multi-field relations (relation.fields has them all)
        id: x[Object.keys(relation.fields)[0]],
        caption: x[relation.captionField],
      })),
      $count: count,
    }
  }

  async displayValueFor(field: FieldUIInfo, value: any) {
    const rel = field.relationToOne!
    const t = this.byKey(rel.entityKey)
    if (!t) return 'Forbidden - ' + value
    const [item] = await t.repo.find({ where: { [Object.keys(rel.fields)[0]]: value } })
    if (!item) return value !== undefined ? 'not found - ' + value : '-'
    if (!item[rel.captionField]) return `Can't display ${rel.captionField} - ${value}`
    return item[rel.captionField]
  }

  async displayValueForEach(field: FieldUIInfo, values: any[]) {
    const rel = field.relationToOne!
    const k = field.valFieldKey
    const t = this.byKey(rel.entityKey)
    if (!t)
      return { [k]: new Map(values.map((x) => [x[k], `Forbidden (${x[k]})`])) }

    const present = values.filter((x) => x[k] !== undefined && x[k] !== null && x[k] !== '')
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
    return { [k]: relationCaptions(rel, k, items) }
  }

  /** Per row update/delete verdicts, for entities whose rules depend on the row. */
  async rowPermissions(superKey: string, ids: string[]) {
    const out: Record<string, { update: boolean; delete: boolean }> = {}
    for (let i = 0; i < ids.length; i += ROW_PERMISSIONS_MAX_IDS) {
      const res = await fetch(`${apiUrl()}/admin/__row-permissions`, {
        method: 'POST',
        headers: headers({ 'content-type': 'application/json' }),
        body: JSON.stringify({ superKey, ids: ids.slice(i, i + ROW_PERMISSIONS_MAX_IDS) }),
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim())
      Object.assign(out, await res.json())
    }
    return out
  }
}

export const god = new God()
