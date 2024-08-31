import type { FieldMetadata } from '../index.js'
import type { Filter } from './filter/filter-interfaces.js'
import type { EntityMetadata, MembersOnly } from './remult3/remult3.js'
import { Sort } from './sort.js'

export interface DataProvider {
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  ensureSchema?(entities: EntityMetadata[]): Promise<void>
  isProxy?: boolean
}
export interface Storage {
  ensureSchema(): Promise<void>
}
export interface EntityDataProviderAggregateOptions
  extends Pick<EntityDataProviderFindOptions, 'where' | 'limit' | 'page'> {
  groupBy?: FieldMetadata[]
  sum?: FieldMetadata[]
  avg?: FieldMetadata[]
  orderBy?: {
    field?: FieldMetadata
    isDescending?: boolean
    operation?: 'sum' | 'avg' | 'count'
  }[]
}

export interface EntityDataProvider {
  count(where: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>
  aggregate(options?: EntityDataProviderAggregateOptions): Promise<any[]>
  update(id: any, data: any): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any): Promise<any>
}
export interface ProxyEntityDataProvider {
  insertMany(data: any[]): Promise<any[]>
  deleteMany(where: Filter): Promise<number>
  updateMany(where: Filter, data: any): Promise<number>
}
export interface EntityDataProviderFindOptions {
  where?: Filter
  limit?: number
  page?: number
  orderBy?: Sort
}
export interface RestDataProviderHttpProvider {
  post(url: string, data: any): Promise<any>
  delete(url: string): Promise<void>
  put(url: string, data: any): Promise<any>
  get(url: string): Promise<any>
}

export function extractSort(sort: any): Sort {
  if (sort instanceof Array) {
    let r = new Sort()
    sort.forEach((i) => {
      r.Segments.push(i)
    })
    return r
  }
  return sort
}

export interface ErrorInfo<entityType = unknown> {
  message?: string
  modelState?: {
    [Properties in keyof Partial<MembersOnly<entityType>>]?: string
  }
  stack?: string
  exception?: any
  httpStatusCode?: number
}
