import { Column } from './column';
import { Entity } from './entity';
import { Sort, SortSegment } from './sort';
import { FilterBase } from './filter/filter-interfaces';

export interface DataProvider {
    getEntityDataProvider(entity: Entity<any>): EntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
}

export interface EntityDataProvider {
    count(where: FilterBase): Promise<number>;
    find(options?: EntityDataProviderFindOptions): Promise<Array<any>>;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export interface EntityDataProviderFindOptions {
    where?: FilterBase;
    limit?: number;
    page?: number;
    orderBy?: Sort;
    __customFindData?: any;
}

export interface EntityProvider<T extends Entity<any>> {
    find(options?: FindOptions<T>): Promise<T[]>
    count(where?: EntityWhere<T>): Promise<number>;
    create(): T;
}

export declare type EntityWhere<entityType extends Entity<any>> = (entityType: entityType) => FilterBase;
export declare type EntityOrderBy<entityType extends Entity<any>> = ((entityType: entityType) => Sort) | ((entityType: entityType) => (Column<any>)) | ((entityType: entityType) => (Column<any> | SortSegment)[]);
export interface FindOptions<entityType extends Entity<any>> {
    where?: EntityWhere<entityType>;
    orderBy?: EntityOrderBy<entityType>;
    limit?: number;
    page?: number;
    __customFindData?: any;
}


export interface __RowsOfDataForTesting {
    rows: any;
}
