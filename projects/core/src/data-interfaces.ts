import { Column } from './column';
import { Entity } from './entity';
import { Sort, SortSegment } from './sort';
import { FilterBase } from './filter/filter-interfaces';

export interface DataProvider {
    getEntityDataProvider(entity: Entity): EntityDataProvider;
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

export interface EntityProvider<T extends Entity> {
    find(options?: FindOptions<T>): Promise<T[]>
    count(where?: EntityWhere<T>): Promise<number>;
    create(): T;
    
}

export declare type EntityWhere<entityType extends Entity> = (entityType: entityType) => FilterBase;
export declare type EntityOrderBy<entityType extends Entity> = ((entityType: entityType) => Sort) | ((entityType: entityType) => (Column)) | ((entityType: entityType) => (Column | SortSegment)[]);

export function entityOrderByToSort<T2,T extends Entity<T2>>(entity: T,orderBy: EntityOrderBy<T>): Sort {
    return extractSort(  orderBy(entity));
    
  }
  export function extractSort(sort: any): Sort {
    
    if (sort instanceof Sort)
      return sort;
    if (sort instanceof Column)
      return new Sort({ column: sort });
    if (sort instanceof Array) {
      let r = new Sort();
      sort.forEach(i => {
        if (i instanceof Column)
          r.Segments.push({ column: i });
        else r.Segments.push(i);
      });
      return r;
    }
  }
  
export interface FindOptions<entityType extends Entity> {
    where?: EntityWhere<entityType>;
    orderBy?: EntityOrderBy<entityType>;
    limit?: number;
    page?: number;
    __customFindData?: any;
}


export interface __RowsOfDataForTesting {
    rows: any;
}
