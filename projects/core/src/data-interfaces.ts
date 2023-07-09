import { Sort } from './sort'
import { Filter } from './filter/filter-interfaces'
import { EntityMetadata, OmitEB } from './remult3'
import type { Remult } from './context'

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
export interface EntityDataProvider {
  count(where: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>
  update(id: any, data: any): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any): Promise<any>
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
  if (sort instanceof Sort) return sort
  if (sort instanceof Array) {
    let r = new Sort()
    sort.forEach((i) => {
      r.Segments.push(i)
    })
    return r
  }
}

export interface ErrorInfo<entityType = any> {
  message?: string
  modelState?: { [Properties in keyof Partial<OmitEB<entityType>>]?: string }
  stack?: string
  exception?: any
  httpStatusCode?: number
}
