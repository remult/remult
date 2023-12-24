import type { EntityDataProviderFindOptions } from '../data-interfaces.js'
import type { Filter } from '../filter/filter-interfaces.js'
import type {
  EntityFilter,
  EntityOrderBy,
  FindOptions,
  LoadOptions,
  Repository,
} from './remult3.js'

export interface RepositoryInternal<entityType> {
  createAfterFilter(
    orderBy: EntityOrderBy<entityType>,
    lastRow: entityType,
  ): Promise<EntityFilter<entityType>>
  fromJsonArray(
    jsonItems: any[],
    loadOptions: LoadOptions<entityType>,
  ): Promise<entityType[]>
  buildEntityDataProviderFindOptions(
    options: FindOptions<entityType>,
  ): Promise<EntityDataProviderFindOptions>
  translateWhereToFilter(where: EntityFilter<entityType>): Promise<Filter>
  getCachedById(id: any, doNotLoadIfNotFound: boolean): entityType
  getCachedByIdAsync(id: any, doNotLoadIfNotFound: boolean): Promise<entityType>
  addToCache(item: entityType)
}
export function getRepositoryInternals<entityType>(
  repo: Repository<entityType>,
): RepositoryInternal<entityType> {
  const x = repo as any
  if (typeof x[getInternalKey] === 'function') return x[getInternalKey]()
  throw Error('Error getting repository internal from ' + repo)
}

export const getInternalKey = 'getInternal'
