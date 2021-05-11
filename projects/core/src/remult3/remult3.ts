import { Column } from "../column";
import { ColumnSettings } from "../column-interfaces";
import { Context, IterateToArrayOptions, UserInfo } from "../context";
import { DataApiRequest } from "../data-api";
import { EntityOptions } from "../entity";
import { Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";


export class IdEntity {
    id: string;
}
/*
[] return the test that was disabled by moving the server expression to remult 3- "get based on id virtual column async"
[] think of id entity.
[] rename `name` to `key` in Entity Settings
[] consider the case where the name in restapi (json name) of a column is different from it's member - see commented test "json name is important"
[] consider sqlExpression where does it get the column name - see "test-sql-expression.spec.ts" line 41,47
[] original data should reflect the values after server expressions
[] reconsider if setting a value, clears the error member - see test ""validation clears on change"", "get based on id virtual column"
[] use helmet instead of force https
[] fix timeout by using a repeat mechanism in context.
[] replace method not allowed with forbidden - when something is not allowed
[] add reflect metadata to dependencies
[] rebuild validation model for ServerMethod

[] consider the previous functionalty of being aware of the id column type of the entity, to allow a short id lookup
[] chose error instead of validationError
[] fix allowApiCrud
    [] fix tests relevant to finding out the relationship between crud and specific apis,"allow api read depends also on api crud"
[] revive value list column tests "get array works with filter in body","get array works with filter in body and in array statement","get array works with filter in body and or statement"
[] "dbname of entity can use column names"
[] "compound id"
[]"getArray works with filter and in with closed list columns"
[]"getArray works with filter and multiple values with closed list columns"
[] "apiRequireId"
*/


export interface rowHelper<T> {
    _updateEntityBasedOnApi(body: any);
    isValid(): boolean;
    undoChanges();
    save(): Promise<T>;
    reload(): Promise<void>;
    delete(): Promise<void>;
    isNew(): boolean;
    wasChanged(): boolean;
    wasDeleted():boolean;
    toApiPojo(): any;
    columns: entityOf<T>;
  
    repository:Repository<T>

}
export type entityOf<Type> = {
    [Properties in keyof Type]: column<Type[Properties],Type>
} & {
    find(col: column<any,Type>): column<any,Type>
}


export type sortOf<Type> = {
    [Properties in keyof Type]: TheSort
}
export interface TheSort {
    descending: TheSort;
    __toSegment(): SortSegment;
}
export type idOf<Type> = {
    [Properties in keyof Type]: IdDefs
}
export interface IdDefs {

}

export interface column<T,entityType> {
    dbName: string;
    key: string;
    caption: string;
    inputType: string;
    error: string;
    displayValue: string;
    inputValue: string;
    value: T;
    originalValue: T;
    wasChanged(): boolean;
    rowHelper:rowHelper<entityType>
}

export interface Repository<T> {
    _getApiSettings(): import("../data-api").DataApiSettings<T>;
    defs: {
        getName(): string,
        getDbName():string
    };
    
    
   
    find(options?: FindOptions<T>): Promise<T[]>;
    iterate(options?: EntityWhere<T> | IterateOptions<T>): IteratableResult<T>;
    count(where?: EntityWhere<T>): Promise<number>;
    findFirst(where?: EntityWhere<T> | IterateOptions<T>): Promise<T>;
    findOrCreate(options?: EntityWhere<T> | IterateOptions<T>): Promise<T>;
        /**
     * Used to get non critical values from the Entity.
    * The first time this method is called, it'll return a new instance of the Entity.
    * It'll them call the server to get the actual value and cache it.
    * Once the value is back from the server, any following call to this method will return the cached row.
    * 
    * It was designed for displaying a value from a lookup table on the ui - counting on the fact that it'll be called multiple times and eventually return the correct value.
    * 
    * * Note that this method is not called with `await` since it doesn't wait for the value to be fetched from the server.
    * @example
    * return  context.for(Products).lookup(p=>p.id.isEqualTo(productId));
     */
    lookup(filter: EntityWhere<T>): T;
       /** returns a single row and caches the result for each future call
     * @example
     * let p = await this.context.for(Products).lookupAsync(p => p.id.isEqualTo(productId));
     */
    lookupAsync(filter: EntityWhere<T>): Promise<T>;
    create(): T;
    findId(id: any): Promise<T>;
    save(entity: T): Promise<T>;
    delete(entity: T): Promise<void>;

    updateEntityBasedOnWhere(where: EntityWhere<T>, r: T);
    packWhere(where: EntityWhere<T>): any;
    unpackWhere(packed: any): Filter;
    extractWhere(filterInfo: {
        get: (key: string) => any;
      }): Filter;
    getRowHelper(item:T):rowHelper<T>;
    translateWhereToFilter(where:EntityWhere<T>):Filter;
    isIdColumn(col: Column<any>):boolean;
    getIdFilter(id: any): Filter;

}
export interface FindOptions<T> {
    /** filters the data
     * @example
     * where p => p.price.isGreaterOrEqualTo(5)
     * @see For more usage examples see [EntityWhere](https://remult-ts.github.io/guide/ref_entitywhere)
     */
    where?: EntityWhere<T>;
    /** Determines the order in which the result will be sorted in
     * @see See [EntityOrderBy](https://remult-ts.github.io/guide/ref__entityorderby) for more examples on how to sort
     */
    orderBy?: EntityOrderBy<T>;
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
export declare type EntityOrderBy<T> = (entity: sortOf<T>) => TheSort[] | TheSort;
export declare type EntityWhereItem<entityType> = ((entityType: filterOf<entityType>) => (Filter | Filter[]));

export declare type EntityWhere<entityType> = EntityWhereItem<entityType> | EntityWhereItem<entityType>[];


export class ManyToOne<T> {
    constructor(rep: Repository<T>, where: EntityWhere<T>) {

    }
    async waitLoad() {

    }
    exists() {
        return false;
    }
    item: T;
}
export class EntityBase {
    _: rowHelper<this>;
}

export interface filterOptions<x> {
    isEqualTo(val: x): Filter;
    isDifferentFrom(val: x);
    isIn(val: x[]): Filter;
    isNotIn(val: x[]): Filter;
}

export interface comparableFilterItem<x> extends filterOptions<x> {


    isLessOrEqualTo(val: x): Filter;
    isLessThan(val:x):Filter;
    isGreaterThan(val: x): Filter;
    isGreaterOrEqualTo(val:x):Filter;
}
export interface supportsContains<x> extends filterOptions<x> {
    contains(val: string): Filter;
}

export type filterOf<Type> = {
    [Properties in keyof Type]: Type[Properties] extends number | Date ? comparableFilterItem<Type[Properties]> :
    Type[Properties] extends string ? supportsContains<Type[Properties]> & comparableFilterItem<Type[Properties]> :
    supportsContains<Type[Properties]>
}

export type NewEntity<T> = { new(...args: any[]): T };

export interface IterateOptions<entityType> {
    where?: EntityWhere<entityType>;
    orderBy?: EntityOrderBy<entityType>;
    progress?: { progress: (progress: number) => void };
}
export interface IteratableResult<T> {
    toArray(options?: IterateToArrayOptions): Promise<T[]>;
    first(): Promise<T>;
    count(): Promise<number>;
    forEach(what: (item: T) => Promise<any>): Promise<number>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<T>>;
    };
}
