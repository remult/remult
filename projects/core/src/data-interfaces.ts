import { Column } from './column';
import { Entity } from './entity';
import { Sort, SortSegment } from './sort';
import { AndFilter, Filter } from './filter/filter-interfaces';


export interface DataProvider {
  getEntityDataProvider(entity: Entity): EntityDataProvider;
  transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
}

export interface EntityDataProvider {
  count(where: Filter): Promise<number>;
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>;
  update(id: any, data: any): Promise<any>;
  delete(id: any): Promise<void>;
  insert(data: any): Promise<any>;
}
export interface EntityDataProviderFindOptions {
  where?: Filter;
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


/**Used to filter the desired result set
 * @example
 * where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
 */
export declare type EntityWhere<entityType extends Entity> = EntityWhereItem<entityType> | EntityWhereItem<entityType>[];
/**Used to filter the desired result set
 * @example
 * where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
 */

export declare type EntityWhereItem<entityType extends Entity> = ((entityType: entityType) => (Filter | Filter[]));
/** Determines the order of rows returned by the query.
 * @example
 * await this.context.for(Products).find({ orderBy: p => p.name })
 * @example
 * await this.context.for(Products).find({ orderBy: p => [p.price, p.name])
 * @example
 * await this.context.for(Products).find({ orderBy: p => [{ column: p.price, descending: true }, p.name])
 */
export declare type EntityOrderBy<entityType extends Entity> = ((entityType: entityType) => Sort) | ((entityType: entityType) => (Column)) | ((entityType: entityType) => (Column | SortSegment)[]);

export function entityOrderByToSort<T2, T extends Entity<T2>>(entity: T, orderBy: EntityOrderBy<T>): Sort {
  return extractSort(orderBy(entity));

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
  /** filters the data
   * @example
   * where p => p.price.isGreaterOrEqualTo(5)
   * @see For more usage examples see [EntityWhere](https://remult-ts.github.io/guide/ref_entitywhere)
   */
  where?: EntityWhere<entityType>;
  /** Determines the order in which the result will be sorted in
   * @see See [EntityOrderBy](https://remult-ts.github.io/guide/ref__entityorderby) for more examples on how to sort
   */
  orderBy?: EntityOrderBy<entityType>;
  /** Determines the number of rows returned by the request, on the browser the default is 25 rows 
   * @example
   * this.products = await this.context.for(Products).find({
   *  limit:10,
   *  page:2
   * })
  */
  limit?: number;
  /** Determines the page number that will be used to extract the data 
   * @example
   * this.products = await this.context.for(Products).find({
   *  limit:10,
   *  page:2
   * })
  */
  page?: number;
  __customFindData?: any;
}


export interface __RowsOfDataForTesting {
  rows: any;
}
export function translateEntityWhere<entityType extends Entity>(where: EntityWhere<entityType>, entity: entityType): Filter {
  if (Array.isArray(where)) {
    return new AndFilter(...where.map(x => {
      if (x===undefined)
      return undefined;
      let r = x(entity);
      if (Array.isArray(r))
        return new AndFilter(...r);
      return r;
    }));

  }
  else if (typeof where ==='function') {
    let r = where(entity);
    if (Array.isArray(r))
      return new AndFilter(...r);
    return r;
  }

}

export function updateEntityBasedOnWhere<lookupIdType, T extends Entity<lookupIdType>>(where: EntityWhere<T>, r: T) {
  let w = translateEntityWhere(where, r);
  if (w) {
      w.__applyToConsumer({
          containsCaseInsensitive: () => { },
          isDifferentFrom: () => { },
          isEqualTo: (col, val) => {
              col.value = val;
          },
          isGreaterOrEqualTo: () => { },
          isGreaterThan: () => { },
          isIn: () => { },
          isLessOrEqualTo: () => { },
          isLessThan: () => { },
          isNotNull: () => { },
          isNull: () => { },
          startsWith: () => { },
          or: () => { }
      });
  }
}
export interface ErrorInfo {
  message?: string;
  modelState?: { [key: string]: string };
  stack?: string;
  exception?:any;
}
