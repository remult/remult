import type { EntityDataProviderFindOptions } from '../data-interfaces';
import type { Filter } from '../filter/filter-interfaces';
import type { EntityFilter, EntityOrderBy, FindOptions, LoadOptions, Repository } from './remult3';
export interface RepositoryInternal<entityType> {
    createAfterFilter(orderBy: EntityOrderBy<entityType>, lastRow: entityType): Promise<EntityFilter<entityType>>;
    fromJsonArray(jsonItems: any[], loadOptions: LoadOptions<entityType>): Promise<entityType[]>;
    buildEntityDataProviderFindOptions(options: FindOptions<entityType>): Promise<EntityDataProviderFindOptions>;
    translateWhereToFilter(where: EntityFilter<entityType>): Promise<Filter>;
    getCachedById(id: any, doNotLoadIfNotFound: boolean): entityType;
    getCachedByIdAsync(id: any, doNotLoadIfNotFound: boolean): Promise<entityType>;
    addToCache(item: entityType): any;
}
export declare function getRepositoryInternals<entityType>(repo: Repository<entityType>): RepositoryInternal<entityType>;
export declare const getInternalKey = "getInternal";
