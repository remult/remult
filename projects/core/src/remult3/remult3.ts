
import { FieldMetadata } from "../column-interfaces";
import { IterateToArrayOptions, Unobserve } from "../context";
import { EntityOptions as EntityOptions } from "../entity";
import { Filter } from "../filter/filter-interfaces";
import { Sort, SortSegment } from "../sort";
import { entityEventListener } from "../__EntityValueProvider";




/*
## Should work



## TODO






## review with Yoni

[] consider removing Input type from field (it exists in metadata)
[] included display value and input type also in value converter - ias it is relevant to date only, and also value list
[] add code that entity relation can be tested for null - and it'll not perform fetch.
[] talk about familyDeliveries.$.courier.hasValue - to see if it was set without loading the row


[] should save, undo changes and reload load all non lazy fields or based on the load in the original query?
### questions about find with create
[] should the new row created when not found enter the cache?
[] should cache empty results?
[] find with create and cache, and then find without create and with cache - should return the cache?

[] talk some more about value change, since in the current implementation, an update through click doesn't fire it
[] "Number is always a number"
    [] "test number is always number"
    [] test number is always a number - settings value with any string, and then doing math options for it.
[] consider the setting decimal digits, instead might be useful to determine db storage - replaced with db type

[] the inconsistenacy beyween Date and DateTime - in our naming and also with input management

[] apiDataFilter
[] fixedFilter
[] consider a column that is saved to more than one column in the db

[] i make errors with the order of the generic parameters, entity, column and vice versa
[V] reconsider all the where stuff - just searh references for AndFilter to see the problem
[] make where awaitable
[] reconsider the custom filter with the FD
[] talk about allow null for date, object types, etc...
[] when using a value list column - it generates an int column with allow null, and no options to set it as allow null false and default value for now on the create table script
[] consider adding the count value in the response of the array
[] talk about forgetting the :type on fields - it's dangerous and can lead to debug issues - on the other hand we want some default - not sure if we should scream

[] talk about typescript loosing types in a case of self reference - in this sample, the visible that references the grid - breaks the typing
```
 grid = new GridSettings(this.context.for(Products), {
    allowCrud: true,
    where:x=>x.name.contains("1"),
    gridButtons:[{
      name:'dosomething',
      visible:()=>this.grid.selectedRows.length>0
    }]
  });
```
[] talk about $.find('name') vs $['name']
[]c.defs.valueConverter !== DateOnlyValueConverter
[] dependency injection for decorator
[] current user in any app - not simple enough.



## context related:
[] entity allowed gets entity as second parameter, because allowed always get the context as first parameter
[] rename context to remult
[] with regards to the context init and setting the different things - maybe we should add an option to fail there and fail the request - for example in case the user info was updated since the last token was given and he has no rights any more etc...
[] consider the case when initing context, and cashing rows between requests, you might get a save to a context of a request two hours ago.
[] custom context 
[] consider the name FilterFactories to be EntityFilterFactories
[] add to entity options a lambda that gets context and returns data provider.
[] consider an option of running it all in the browser, for the development start, just like weve done with the json database


## things that came up during react:
[] review weird typing issue with article payload action that failed for some reason
[] talk about invoking client side validation
[] talk about isvalid that gives you indication of the data is valid etc....



## compound id column
[V] "compound id"
[V] reconsider the IdColumn member - might make sense to remove it
[] sql database, update of row where id is not named id is compromised
[] consider DbAutoIncrement to decorator
[] reconsider idColumn - maybe internalize it.
[] rethink compoundid and idmetadata to encapsulate some of the ugliness of ids.





## context stuff:
    * repository for
    * current user
        *  is signed in
        * is allowed
        * basic current user info
        * setuser
        * add listener to user
    * map (getter and setter of stuff)
    * onServer (let's you know you're on the server)
    * Info about request

## consider if needed

[] consider the case where the name in restapi (json name) of a column is different from it's member - see commented test "json name is important"
[] reconsider if setting a value, clears the error member - see test ""validation clears on change"", "get based on id virtual column"
[] consider the previous functionalty of being aware of the id column type of the entity, to allow a short id lookup
[] apiRequireId = reconsider, maybe give more flexibility(filter orderid on orderdetails) etc...

[] fails because author is undefined. allowApiDelete: (context, comment) => comment.author.username == context.user.id,


## remult angular future
[] change the getValue - to  displayValue
[] change the input type to support code+value, displayValueOnly











*/


export interface EntityRef<entityType> {
    hasErrors(): boolean;
    undoChanges();
    save(): Promise<entityType>;
    reload(): Promise<entityType>;
    delete(): Promise<void>;
    isNew(): boolean;
    wasChanged(): boolean;
    wasDeleted(): boolean;
    fields: Fields<entityType>;
    error: string;
    getId(): any;
    repository: Repository<entityType>;
    metadata: EntityMetadata<entityType>
    toApiJson(): any;
}
export type Fields<entityType> = {
    [Properties in keyof entityType]: FieldRef<entityType[Properties], entityType>
} & {
    find(col: FieldMetadata): FieldRef<any, entityType>,
    [Symbol.iterator]: () => IterableIterator<FieldRef<any, entityType>>



}
export type FieldsMetadata<entityType> = {
    [Properties in keyof entityType]: FieldMetadata
} & {
    find(col: FieldMetadata): FieldMetadata,
    [Symbol.iterator]: () => IterableIterator<FieldMetadata>


}


export type SortSegments<entityType> = {
    [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}

export interface FieldRef<valueType, entityType = any> {
    inputType: string;
    error: string;
    displayValue: string;
    value: valueType;
    originalValue: valueType;
    inputValue: string;
    wasChanged(): boolean;
    entityRef: EntityRef<entityType>;
    container: entityType;
    metadata: FieldMetadata<entityType>;
    load(): Promise<valueType>;
}
export interface IdMetadata<entityType = any> {

    field: FieldMetadata<any>;
    getIdFilter(id: any): Filter;
    isIdField(col: FieldMetadata): boolean;
    createIdInFilter(items: entityType[]): Filter;

}

export interface EntityMetadata<entityType = any> {
    readonly idMetadata: IdMetadata<entityType>;
    readonly key: string,
    readonly dbName: string,
    readonly fields: FieldsMetadata<entityType>,
    readonly caption: string;
    readonly options: EntityOptions;
}
export interface Repository<entityType> {
    fromJson(x: any, isNew?: boolean): Promise<entityType>;
    metadata: EntityMetadata<entityType>;
    find(options?: FindOptions<entityType>): Promise<entityType[]>;
    iterate(options?: EntityWhere<entityType> | IterateOptions<entityType>): IterableResult<entityType>;
    findFirst(where?: EntityWhere<entityType> | FindFirstOptions<entityType>): Promise<entityType>;
    findId(id: any, options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
    count(where?: EntityWhere<entityType>): Promise<number>;
    create(item?: Partial<entityType>): entityType;
    getEntityRef(item: entityType): EntityRef<entityType>;
    save(item: entityType): Promise<entityType>;
    delete(item: entityType): Promise<void>;
    addEventListener(listener: entityEventListener<entityType>): Unobserve;
}
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {

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
/** Determines the order of rows returned by the query.
 * @example
 * await this.context.for(Products).find({ orderBy: p => p.name })
 * @example
 * await this.context.for(Products).find({ orderBy: p => [p.price, p.name])
 * @example
 * await this.context.for(Products).find({ orderBy: p => [{ field: p.price, descending: true }, p.name])
 */
export declare type EntityOrderBy<entityType> = (entity: SortSegments<entityType>) => SortSegment[] | SortSegment;

/**Used to filter the desired result set
 * @example
 * where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
 */
export declare type EntityWhere<entityType> = ((entityType: FilterFactories<entityType>) => (Filter | Filter[] | EntityWhere<entityType>)) | EntityWhere<entityType>[];





export interface FilterFactory<valueType> {
    isEqualTo(val: valueType): Filter;
    isDifferentFrom(val: valueType);
    isIn(val: valueType[]): Filter;
    isNotIn(val: valueType[]): Filter;
}

export interface ComparisonFilterFactory<valueType> extends FilterFactory<valueType> {


    isLessOrEqualTo(val: valueType): Filter;
    isLessThan(val: valueType): Filter;
    isGreaterThan(val: valueType): Filter;
    isGreaterOrEqualTo(val: valueType): Filter;
}
export interface ContainsFilterFactory<valueType> extends FilterFactory<valueType> {
    contains(val: string): Filter;
}

export type FilterFactories<entityType> = {
    [Properties in keyof entityType]: entityType[Properties] extends number | Date ? ComparisonFilterFactory<entityType[Properties]> :
    entityType[Properties] extends string ? (ContainsFilterFactory<entityType[Properties]> & ComparisonFilterFactory<entityType[Properties]>) :
    ContainsFilterFactory<entityType[Properties]>
}
export interface LoadOptions<entityType> {
    load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[]
}
export interface FindOptionsBase<entityType> extends LoadOptions<entityType> {
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
}
export interface FindFirstOptions<entityType> extends FindOptionsBase<entityType>, FindFirstOptionsBase<entityType> {



}
export interface FindFirstOptionsBase<entityType> extends LoadOptions<entityType> {
    /** default true
      */
    useCache?: boolean;

    createIfNotFound?: boolean;
}
export interface IterateOptions<entityType> extends FindOptionsBase<entityType> {
    progress?: { progress: (progress: number) => void };
}
export interface IterableResult<T> {
    toArray(options?: IterateToArrayOptions): Promise<T[]>;
    first(): Promise<T>;
    count(): Promise<number>;
    forEach(what: (item: T) => Promise<any>): Promise<number>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<T>>;
    };
}

