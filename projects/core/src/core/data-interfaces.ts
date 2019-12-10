import { Column } from './column';
import { Entity } from './entity';
import { Sort, SortSegment } from './sort';
import { FilterBase } from './filter/filter-interfaces';



export interface EntityDataProvider {
    count(where: FilterBase): Promise<number>;
    find(options?: FindOptions): Promise<Array<any>>;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export interface FindOptions {
    where?: FilterBase;
    limit?: number;
    page?: number;
    orderBy?: Sort;
    additionalUrlParameters?: any;
}

export interface EntityProvider<T extends Entity<any>> {
    find(options?: FindOptionsPerEntity<T>): Promise<T[]>
    count(where?: EntityWhere<T>): Promise<number>;
    create(): T;
}

export declare type EntityWhere<rowType extends Entity<any>> = (rowType: rowType) => FilterBase;
export declare type EntityOrderBy<rowType extends Entity<any>> = ((rowType: rowType) => Sort) | ((rowType: rowType) => (Column<any>)) | ((rowType: rowType) => (Column<any> | SortSegment)[]);
export interface FindOptionsPerEntity<rowType extends Entity<any>> {
    where?: EntityWhere<rowType>;
    orderBy?: EntityOrderBy<rowType>;
    limit?: number;
    page?: number;
    additionalUrlParameters?: any;
}

export interface DataProvider {
    getEntityDataProvider(entity: Entity<any>): EntityDataProvider;

}

export interface RowsOfDataForTesting {
    rows: any;
}
export interface SupportsTransaction extends DataProvider {
    doInTransaction(what: (dp: DataProvider) => Promise<void>): Promise<void>;

}