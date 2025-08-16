import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
  ProxyEntityDataProvider,
  RestDataProviderHttpProvider,
} from '../data-interfaces.js'

import { UrlBuilder } from '../../urlBuilder.js'
import { buildRestDataProvider } from '../buildRestDataProvider.js'
import type { ApiClient } from '../context.js'
import { customUrlToken, Filter } from '../filter/filter-interfaces.js'
import type { EntityMetadata, FindOptions } from '../remult3/remult3.js'
import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import { remultStatic } from '../remult-static.js'

export class RestDataProvider implements DataProvider {
  constructor(
    private apiProvider: () => ApiClient,
    private entityRequested?: (entity: EntityMetadata) => void,
  ) {}
  public getEntityDataProvider(entity: EntityMetadata): RestEntityDataProvider {
    this.entityRequested?.(entity)
    return new RestEntityDataProvider(
      () => {
        return buildFullUrl(this.apiProvider()?.url, entity.key)
      },
      () => {
        return buildRestDataProvider(this.apiProvider().httpClient)
      },
      entity,
    )
  }
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  isProxy = true
}
export function buildFullUrl(
  httpClientUrl: string | undefined,
  entityKey: string,
) {
  if (httpClientUrl === undefined || httpClientUrl === null)
    httpClientUrl = '/api'
  return httpClientUrl + '/' + entityKey
}

//@internal
export function findOptionsToJson<entityType = unknown>(
  options: FindOptions<entityType>,
  meta: EntityMetadata<entityType>,
) {
  if (options.include) {
    let newInclude: any = {}
    for (const key in options.include) {
      if (Object.prototype.hasOwnProperty.call(options.include, key)) {
        let element = options.include[key]
        if (typeof element === 'object') {
          const rel = getRelationFieldInfo(meta.fields.find(key))
          if (rel) {
            element = findOptionsToJson<unknown>(
              element as any,
              rel.toRepo.metadata,
            )
          }
        }
        newInclude[key] = element
      }
    }
    options = { ...options, include: newInclude }
  }
  if (options.where)
    options = {
      ...options,
      where: Filter.entityFilterToJson(meta, options.where),
    }
  if (options.load)
    options = {
      ...options,
      load: options.load(meta.fields).map((y) => y.key) as any,
    }
  if (options.select) {
    options = { ...options, select: Object.keys(options.select) as any }
  }
  return options
}
//@internal
export function findOptionsFromJson(
  json: any,
  meta: EntityMetadata,
): FindOptions<any> {
  let r: any = {}
  for (const key of [
    'limit',
    'page',
    'where',
    'orderBy',
    'include',
    'select',
  ] as (keyof FindOptions<any>)[]) {
    if (json[key] !== undefined) {
      if (key === 'where') {
        r[key] = Filter.entityFilterFromJson(meta, json.where)
      } else if (key === 'include') {
        let newInclude = { ...json[key] }

        for (const key in newInclude) {
          if (Object.prototype.hasOwnProperty.call(newInclude, key)) {
            let element = newInclude[key]
            if (typeof element === 'object') {
              const rel = getRelationFieldInfo(meta.fields.find(key))
              if (rel) {
                element = findOptionsFromJson(element, rel.toRepo.metadata)
              }
            }
            newInclude[key] = element
          }
        }
        r[key] = newInclude
      } else if (key === 'select') {
        r[key] = json.select.reduce((acc: any, key: string) => {
          acc[key] = true
          return acc
        }, {} as any)
      } else r[key] = json[key]
    }
  }
  if (json.load) {
    r.load = (z: any) => json.load.map((y: any) => z.find(y))
  }
  return r
}

export class RestEntityDataProvider
  implements EntityDataProvider, ProxyEntityDataProvider
{
  constructor(
    private url: () => string,
    private http: () => RestDataProviderHttpProvider,
    private entity: EntityMetadata,
  ) {}
  query(
    options: EntityDataProviderFindOptions,
    aggregateOptions: EntityDataProviderGroupByOptions,
  ): Promise<{ items: any[]; aggregates: any }> {
    const r = this.buildFindRequest(options)
    return r
      .run('query', {
        aggregate: this.buildAggregateOptions(aggregateOptions),
      })
      .then(({ items, aggregates }) => ({
        items: items.map((x: any) => this.translateFromJson(x)),
        aggregates,
      }))
  }

  async groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    const { run } = this.buildFindRequest({
      where: options?.where,
      limit: options?.limit,
      page: options?.page,
    })
    const body = this.buildAggregateOptions(options)
    const result: any[] = await run(
      'groupBy',
      Object.keys(body).length > 0 ? body : undefined,
    )
    if (options?.group)
      result.forEach((row) => {
        for (const g of options!.group!) {
          row[g.key] = g.valueConverter.fromJson(row[g.key])
        }
      })
    return result
  }

  private buildAggregateOptions(
    options: EntityDataProviderGroupByOptions | undefined,
  ) {
    return {
      groupBy: options?.group?.map((x) => x.key),
      sum: options?.sum?.map((x) => x.key),
      avg: options?.avg?.map((x) => x.key),
      min: options?.min?.map((x) => x.key),
      max: options?.max?.map((x) => x.key),
      distinctCount: options?.distinctCount?.map((x) => x.key),
      orderBy: options?.orderBy?.map((x) => ({ ...x, field: x.field?.key })),
    }
  }

  translateFromJson(row: any) {
    let result: any = {}
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.fromJson(row[col.key])
    }
    return result
  }
  translateToJson(row: any) {
    let result: any = {}
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.toJson(row[col.key])
    }
    return result
  }

  public async count(where: Filter): Promise<number> {
    const { run } = this.buildFindRequest({ where })
    return run('count').then((r) => +r.count)
  }
  public async deleteMany(where: Filter): Promise<number> {
    const { run } = this.buildFindRequest({ where }, 'delete')
    return run('deleteMany').then((r) => +r.deleted)
  }
  public async updateMany(where: Filter, data: any): Promise<number> {
    const { run } = this.buildFindRequest({ where }, 'put')
    return run('updateMany', this.toJsonOfIncludedKeys(data)).then(
      (r) => +r.updated,
    )
  }
  public async upsertMany(options: { where: any; set: any }[]): Promise<any[]> {
    const { run } = this.buildFindRequest(undefined)
    return run(
      'upsertMany',
      options.map((x) => ({
        where: this.toJsonOfIncludedKeys(x.where),
        set: x.set !== undefined ? this.toJsonOfIncludedKeys(x.set) : undefined,
      })),
    ).then((r) => r.map((x: any) => this.translateFromJson(x)))
  }
  public find(options?: EntityDataProviderFindOptions): Promise<Array<any>> {
    let { run } = this.buildFindRequest(options)
    return run().then((x) => x.map((y: any) => this.translateFromJson(y)))
  }
  //@internal
  buildFindRequest(
    options: EntityDataProviderFindOptions | undefined,
    method?: 'delete' | 'put' | 'get',
  ) {
    if (!method) method = 'get'
    let url = new UrlBuilder(this.url())
    let filterObject: any
    if (options) {
      if (options.where) {
        filterObject = options.where.toJson() //        options.where.__applyToConsumer(new FilterConsumnerBridgeToUrlBuilder(url));
        if (addFilterToUrlAndReturnTrueIfSuccessful(filterObject, url))
          filterObject = undefined
      }
      if (options.orderBy && options.orderBy.Segments) {
        let sort = ''
        let order = ''
        let hasDescending = false
        options.orderBy.Segments.forEach((c) => {
          if (sort.length > 0) {
            sort += ','
            order += ','
          }
          sort += c.field.key
          order += c.isDescending ? 'desc' : 'asc'
          if (c.isDescending) hasDescending = true
        })
        if (sort) url.add('_sort', sort)
        if (hasDescending) url.add('_order', order)
      }
      if (options.limit) url.add('_limit', options.limit)
      if (options.page) url.add('_page', options.page)
      if (options.select) {
        url.add('_select', options.select.join(','))
      }
    }

    const run = (action?: string, body?: any) => {
      let u = new UrlBuilder(url.url)
      if (!action && filterObject) {
        action = 'get'
      }
      if (action) u.add('__action', action)
      if (filterObject) {
        if (method === 'put') {
          return this.http().post(u.url, { set: body, where: filterObject })
        } else body = { ...body, where: filterObject }
      }
      if (body && method != 'put') return this.http().post(u.url, body)
      else return this.http()[method!](u.url, body)
    }

    return {
      createKey: () => JSON.stringify({ url, filterObject }),
      run,
      subscribe: async (queryId: string) => {
        const result: any[] = await run(liveQueryAction + queryId)
        return {
          result,
          unsubscribe: async () => {
            return remultStatic.actionInfo.runActionWithoutBlockingUI(() =>
              this.http().post(this.url() + '?__action=endLiveQuery', {
                id: queryId,
              }),
            )
          },
        }
      },
    }
  }

  public update(id: any, data: any): Promise<any> {
    return this.http()
      .put(
        this.url() +
          (id != '' ? '/' + encodeURIComponent(id) : '?__action=emptyId'),
        this.toJsonOfIncludedKeys(data),
      )
      .then((y) => this.translateFromJson(y))
  }

  private toJsonOfIncludedKeys(data: any) {
    let result: any = {}
    let keys = Object.keys(data)
    for (const col of this.entity.fields) {
      if (keys.includes(col.key))
        result[col.key] = col.valueConverter.toJson(data[col.key])
    }
    return result
  }

  async delete(id: any): Promise<void> {
    if (id == '')
      await this.deleteMany(
        Filter.fromEntityFilter(
          this.entity,
          this.entity.idMetadata.getIdFilter(id),
        ),
      )
    else return this.http().delete(this.url() + '/' + encodeURIComponent(id))
  }

  public insert(data: any): Promise<any> {
    return this.http()
      .post(this.url(), this.translateToJson(data))
      .then((y) => this.translateFromJson(y))
  }
  insertMany(data: any[]): Promise<any[]> {
    return this.http()
      .post(
        this.url(),
        data.map((data) => this.translateToJson(data)),
      )
      .then((y) => y.map((y: any) => this.translateFromJson(y)))
  }
}

export function addFilterToUrlAndReturnTrueIfSuccessful(
  filter: any,
  url: UrlBuilder,
) {
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key]
      if (Array.isArray(element)) {
        if (element.length > 0 && typeof element[0] === 'object') return false
        if (element.length > 10) return false
      }
      if (key === 'NOT') return false
    }
  }
  for (const key in filter) {
    if (Object.prototype.hasOwnProperty.call(filter, key)) {
      const element = filter[key]
      if (Array.isArray(element)) {
        if (key.endsWith('.in')) url.add(key, JSON.stringify(element))
        else element.forEach((e) => url.add(key, e))
      } else if (key.startsWith(customUrlToken))
        url.add(key, JSON.stringify(element))
      else url.add(key, element)
    }
  }
  return true
}
export const liveQueryAction = 'liveQuery-'
