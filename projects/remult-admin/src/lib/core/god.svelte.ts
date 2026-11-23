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
import { session, settings } from './settings.svelte.js'

export type TableInfo = EntityUIInfo & { repo: Repository<any> }

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
      return { ...info, color: colors[i], repo: remult.repo(C) }
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

    const keys = Object.keys(rel.fields)
    const o: FindOptions<any> =
      keys.length === 1
        ? { where: { [keys[0]]: values.map((x) => x[k]) } }
        : {
            where: {
              $or: values.map((x) => ({
                $and: Object.entries(rel.fields).map(([key, value]) => ({
                  [key]: x[value],
                })),
              })),
            },
          }

    const items = await t.repo.find(o)
    if (!items || items.length === 0)
      return { [k]: new Map(values.map((x) => [x[k], `not found (${x[k]})`])) }
    return { [k]: new Map(items.map((item) => [item.id, item[rel.captionField]])) }
  }
}

export const god = new God()
