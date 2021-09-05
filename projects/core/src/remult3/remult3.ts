
import { FieldMetadata } from "../column-interfaces";
import { IterateToArrayOptions, Unobserve } from "../context";
import { EntityOptions as EntityOptions } from "../entity";
import { Filter } from "../filter/filter-interfaces";
import { BackendMethod } from "../server-action";
import { Sort, SortSegment } from "../sort";
import { entityEventListener } from "../__EntityValueProvider";




/*
## Should work



## TODO

[V] remove recursive types with array (Where etc...) Type instantiation is excessively deep and possibly infinite.Vetur(2589) - same problem we had before, now happens with vue.

[V] introduce the context based factory for EntityOptions and FieldOptions
    @Entity({},(o,c)=>{
        o.
    })
[V] remove info about request from context
[V] remove backend member from context and create isBackend method.
[V] change remult.repo to remult.repo
[V] api find array should load nothing :) (check server methods)
[V] isnull should be valueIsNull, and originalValueIsNull
[V] valueChanged instead of was changed.
[V] reconsider update should only put fields that have changed (also to sql), it makes debugging so much easier.
[V] consider exclude a table from table creation - add sql expression to entity options and don't create these tables.
[V] talk about the case where postgres created a remult, to build the database - and it didn't have our special methods created in init remult, - send context for  create all entities
[V] fix readonly checkbox on grid.
[V]  checkbox shouldn't display text true false on grid
[V] rename AuthenticatedInGuard and not signed in guard
[V] insert filter into the grid button
[] add id lookup in remult angular
[] insert the column selection into the grid button.
[V] change grid button icon to something else

[] test why date is equal to null - didn't work



## review with yoni
[] Filter.toItem, EntityWhereItem, EntityWhere, AllowedItem,Allowed
* maybe not do the array stuff, and instead do a Filter Join to build an array, that way to filter itself stays simple - just a method call

[] @ExcludeEntityFromApi()
    [] require key in entity function parameters, instead of a mandatory key member
    [] let myRoute = api(contextForRouteExtraction).getRoute();

[] reconsider factory, instead of (options,remult), to be (set,remult).
```
(options,remult)=>options.dbName = async ()=>"bla bla"
vs
(set,remult)=>set ({dbName : async ()=>"bla bla"})
```



[] consider the different wheres of an entity, to see where it takes us.
[] reconsider custom part in filter, to include the entity key - to prevent conflicts - rethink the custom interface.
[V] The solution I've found for find id. consider the previous functionality of being aware of the id column type of the entity, to allow a short id lookup

[V] when changing the default number to be full number - started getting these errors: Failed: could not prepare statement (1 AUTOINCREMENT is only allowed on an INTEGER PRIMARY KEY) and had to use @IntegerField for it

[] reconsider input value as id - it causes an  update that then reads from the server again - which causes problems sometime :)


[V] restricted id to be number or string


[V] should find id accept null or undefined - or should it throw an exception?
[V] consider making db name awaitable - since it may rely on an sql that relies on an awaitable promise where









## Yoni NAMING!!!
[] other name for load in find, that indicates that load only loads the detailed fields - not just the lazy ones.
[] apiDataFilter
[] fixedFilter
[] Rename Allowed and InstanceAllowed, and Allow
[] field container type vs entity type vs target

## review with Yoni



[V] included display value and input type also in value converter - ias it is relevant to date only, and also value list
[V] add code that entity relation can be tested for null - and it'll not perform fetch.
[V] talk about familyDeliveries.$.courier.hasValue - to see if it was set without loading the row


[V] should save, undo changes and reload load all non lazy fields or based on the load in the original query?


[V] reconsider isSignedIn




[V] reconsider all the where stuff - just search references for AndFilter to see the problem



[] talk about allow null for date, object types, etc...
[] when using a value list column - it generates an int column with allow null, and no options to set it as allow null false and default value for now on the create table script




[]c.defs.valueConverter !== DateOnlyValueConverter
[] dependency injection for decorator
[] current user in any app - not simple enough.



## context related:
[] entity allowed gets entity as second parameter, because allowed always get the context as first parameter
[] rename context to remult
[] with regards to the context init and setting the different things - maybe we should add an option to fail there and fail the request - for example in case the user info was updated since the last token was given and he has no rights any more etc...
[] consider the case when initing remult, and cashing rows between requests, you might get a save to a context of a request two hours ago.
[] custom context 
[] consider the name FilterFactories to be EntityFilterFactories
[] add to entity options a lambda that gets context and returns data provider.
[] consider an option of running it all in the browser, for the development start, just like weve done with the json database


## things that came up during react:
[] talk about invoking client side validation
[] talk about isvalid that gives you indication of the data is valid etc....
[] reconsider if setting a value, clears the error member - see test ""validation clears on change"", "get based on id virtual column"




## compound id column
[V] "compound id"
[V] reconsider the IdColumn member - might make sense to remove it
[] sql database, update of row where id is not named id is compromised
[] consider DbAutoIncrement to decorator
[] reconsider idColumn - maybe internalize it.
[] rethink compoundid and idmetadata to encapsulate some of the ugliness of ids.





    

## consider if needed



[] apiRequireId = reconsider, maybe give more flexibility(filter orderid on orderdetails) etc...











## V2
### questions about find with create
[] should the new row created when not found enter the cache?
[] should cache empty results?
[] find with create and cache, and then find without create and with cache - should return the cache?
[] talk some more about value change, since in the current implementation, an update through click doesn't fire it
[] consider a column that is saved to more than one column in the db
[] consider adding the count value in the response of the array and do it in the response of iterate, to not break api
[] talk about forgetting the :type on fields - it's dangerous and can lead to debug issues - on the other hand we want some default - not sure if we should scream
[] consider the case where the name in restapi (json name) of a column is different from it's member - see commented test "json name is important"
[] switched back to es5 - since react scripts default is es5 and it breaks things

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
    [Properties in keyof entityType]: FieldRef<entityType, entityType[Properties]>
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>,
    [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>



}
export type FieldsMetadata<entityType> = {
    [Properties in keyof entityType]: FieldMetadata
} & {
    find(fieldMetadataOrKey: FieldMetadata | string): FieldMetadata,
    [Symbol.iterator]: () => IterableIterator<FieldMetadata>


}


export type SortSegments<entityType> = {
    [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}

export interface FieldRef<entityType = any, valueType = any> {
    error: string;
    displayValue: string;
    value: valueType;
    originalValue: valueType;
    inputValue: string;
    valueChanged(): boolean;
    entityRef: EntityRef<entityType>;
    container: entityType;
    metadata: FieldMetadata<entityType>;
    load(): Promise<valueType>;
    valueIsNull(): boolean;
    originalValueIsNull(): boolean;
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
    readonly fields: FieldsMetadata<entityType>,
    readonly caption: string;
    readonly options: EntityOptions;
    getDbName(): Promise<string>;
}
export interface Repository<entityType> {
    /**creates a json representation of the object */
    fromJson(x: any, isNew?: boolean): Promise<entityType>;
    metadata: EntityMetadata<entityType>;
    /** returns a result array based on the provided options */
    find(options?: FindOptions<entityType>): Promise<entityType[]>;
    iterate(whereOrOptions?: EntityWhere<entityType> | IterateOptions<entityType>): IterableResult<entityType>;
    findFirst(whereOrOptions?: EntityWhere<entityType> | FindFirstOptions<entityType>): Promise<entityType>;
    findId(id: entityType extends { id: number } ? number : entityType extends { id: string } ? string : any, options?: FindFirstOptionsBase<entityType>): Promise<entityType>;
    count(where?: EntityWhere<entityType>): Promise<number>;
    create(item?: Partial<entityType>): entityType;
    getEntityRef(item: entityType): EntityRef<entityType>;
    save(item: entityType): Promise<entityType>;
    delete(item: entityType): Promise<void>;
    addEventListener(listener: entityEventListener<entityType>): Unobserve;
}
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {

    /** Determines the number of rows returned by the request, on the browser the default is 100 rows 
     * @example
     * this.products = await this.remult.repo(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    limit?: number;
    /** Determines the page number that will be used to extract the data 
     * @example
     * this.products = await this.remult.repo(Products).find({
     *  limit:10,
     *  page:2
     * })
    */
    page?: number;
}
/** Determines the order of rows returned by the query.
 * @example
 * await this.remult.repo(Products).find({ orderBy: p => p.name })
 * @example
 * await this.remult.repo(Products).find({ orderBy: p => [p.price, p.name])
 * @example
 * await this.remult.repo(Products).find({ orderBy: p => [{ field: p.price, descending: true }, p.name])
 */
export declare type EntityOrderBy<entityType> = (entity: SortSegments<entityType>) => SortSegment[] | SortSegment;

/**Used to filter the desired result set
 * @example
 * where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
 */
export declare type EntityWhere<entityType> = EntityWhereItem<entityType> | EntityWhereItem<entityType>[];
export declare type EntityWhereItem<entityType> = ((entityType: FilterFactories<entityType>) => (Filter | Promise<Filter> | Filter[]));





export interface FilterFactory<valueType> {
    isEqualTo(val: valueType): Filter;
    isDifferentFrom(val: valueType);
    isIn(val: valueType[]): Filter;
    isNotIn(val: valueType[]): Filter;
    metadata: FieldMetadata;
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
export interface IterableResult<entityType> {
    toArray(options?: IterateToArrayOptions): Promise<entityType[]>;
    first(): Promise<entityType>;
    count(): Promise<number>;
    forEach(what: (item: entityType) => Promise<any>): Promise<number>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<entityType>>;
    };
}


