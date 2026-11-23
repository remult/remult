import type { FieldMetadata } from '../column-interfaces.js'
import type {
  DataProvider,
  EntityDataProviderFindOptions,
  EntityDataProviderGroupByOptions,
} from '../data-interfaces.js'
import type { Filter } from '../filter/filter-interfaces.js'
import type { RelationFieldInfo } from './relationInfoMember.js'
import type {
  EntityFilter,
  EntityOrderBy,
  FindOptions,
  GroupByOptions,
  LoadOptions,
  Repository,
} from './remult3.js'

export interface RepositoryInternal<entityType> {
  _createAfterFilter(
    orderBy: EntityOrderBy<entityType>,
    lastRow: entityType,
  ): Promise<EntityFilter<entityType>>
  _fromJsonArray(
    jsonItems: any[],
    loadOptions: LoadOptions<entityType>,
  ): Promise<entityType[]>
  /** Builds the find options that load the related rows for one row's
   * relation field — the same options the relation loader uses. Used by
   * live-query relation tracking (see #712) to build the aggregated where
   * for the follow-up live query of a relation. */
  _findOptionsBasedOnRelation(
    rel: RelationFieldInfo,
    field: FieldMetadata,
    moreFindOptions: FindOptions<any> | undefined,
    row: entityType,
    otherRepo: Repository<unknown>,
  ): {
    findOptions: FindOptions<any>
    returnNull: boolean
    returnUndefined: boolean
  }
  _buildEntityDataProviderFindOptions(
    options: FindOptions<entityType>,
  ): Promise<EntityDataProviderFindOptions>
  __buildGroupByOptions(
    options: GroupByOptions<entityType, any, any, any, any, any, any>,
  ): Promise<EntityDataProviderGroupByOptions>
  _translateWhereToFilter(where: EntityFilter<entityType>): Promise<Filter>
  _dataProvider: DataProvider
  _getCachedById(id: any, doNotLoadIfNotFound: boolean): entityType | undefined
  _getCachedByIdAsync(
    id: any,
    doNotLoadIfNotFound: boolean,
  ): Promise<entityType | undefined>
  _addToCache(item: entityType): void
  _getFocusedRelationRepo(
    field: FieldMetadata,
    item: any,
  ): {
    toRepo: Repository<any>
    returnNull: boolean
    returnUndefined: boolean
  }
}
export function getRepositoryInternals<entityType>(
  repo: Repository<entityType>,
): RepositoryInternal<entityType> {
  const x = repo as any
  if (typeof x[getInternalKey] === 'function') return x[getInternalKey]()
  throw Error('Error getting repository internal from ' + repo)
}

export const getInternalKey = Symbol.for('getInternal')
