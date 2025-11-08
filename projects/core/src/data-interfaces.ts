import type { FieldMetadata } from '../index.js'
import type { Filter } from './filter/filter-interfaces.js'
import type {
  GroupByOperators,
  EntityMetadata,
  MembersOnly,
  InsertOrUpdateOptions,
} from './remult3/remult3.js'
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
export interface EntityDataProviderGroupByOptions
  extends Pick<EntityDataProviderFindOptions, 'where' | 'limit' | 'page'> {
  group?: FieldMetadata[]
  sum?: FieldMetadata[]
  avg?: FieldMetadata[]
  min?: FieldMetadata[]
  max?: FieldMetadata[]
  distinctCount?: FieldMetadata[]
  orderBy?: {
    field?: FieldMetadata
    isDescending?: boolean
    operation?: (typeof GroupByOperators)[number] | 'count'
  }[]
}

export interface EntityDataProvider {
  count(where: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]>
  update(id: any, data: any, options?: InsertOrUpdateOptions): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any, options?: InsertOrUpdateOptions): Promise<any>
}
export interface ProxyEntityDataProvider {
  insertMany(data: any[], options?: InsertOrUpdateOptions): Promise<any[]>
  deleteMany(where: Filter | 'all'): Promise<number>
  updateMany(where: Filter | 'all', data: any): Promise<number>
  query(
    options: EntityDataProviderFindOptions,
    aggregateOptions: EntityDataProviderGroupByOptions,
  ): Promise<{
    items: any[]
    aggregates: any
  }>
  upsertMany(
    options: {
      where: any
      set: any
    }[],
  ): Promise<any[]>
}
export interface EntityDataProviderFindOptions {
  select?: string[]
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
export class EntityError<entityType = unknown>
  extends Error
  implements ErrorInfo<entityType>
{
  constructor(errorInfo: ErrorInfo<entityType>) {
    super(errorInfo.message)
    Object.assign(this, errorInfo)
  }
  modelState?: {
    [Properties in keyof Partial<MembersOnly<entityType>>]?: string
  }
  stack?: string
  exception?: any
  httpStatusCode?: number
}

export class DataProviderPromiseWrapper implements DataProvider {
  constructor(private dataProvider: Promise<DataProvider>) {}
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    return new EntityDataProviderPromiseWrapper(
      this.dataProvider.then((dp) => dp.getEntityDataProvider(entity)),
    )
  }
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    return this.dataProvider.then((dp) => dp.transaction(action))
  }
  ensureSchema?(entities: EntityMetadata[]): Promise<void> {
    return this.dataProvider.then((dp) => dp.ensureSchema?.(entities))
  }
  isProxy?: boolean | undefined
}

class EntityDataProviderPromiseWrapper implements EntityDataProvider {
  constructor(private dataProvider: Promise<EntityDataProvider>) {}
  delete(id: any): Promise<void> {
    return this.dataProvider.then((dp) => dp.delete(id))
  }
  insert(data: any): Promise<any> {
    return this.dataProvider.then((dp) => dp.insert(data))
  }
  count(where: Filter): Promise<number> {
    return this.dataProvider.then((dp) => dp.count(where))
  }
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>> {
    return this.dataProvider.then((dp) => dp.find(options))
  }
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return this.dataProvider.then((dp) => dp.groupBy(options))
  }
  update(id: any, data: any): Promise<any> {
    return this.dataProvider.then((dp) => dp.update(id, data))
  }
}
